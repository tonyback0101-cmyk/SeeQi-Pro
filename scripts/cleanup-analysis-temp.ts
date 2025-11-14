import { createClient } from "@supabase/supabase-js";

type UploadRow = {
  id: string;
  storage_path: string | null;
  created_at: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function getSupabaseClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function run() {
  const thresholdMinutes = Number(process.env.CLEANUP_ANALYSIS_TEMP_THRESHOLD_MINUTES ?? "10");
  const cutoff = new Date(Date.now() - thresholdMinutes * 60_000).toISOString();
  const supabase = getSupabaseClient();

  const { data: job, error: jobError } = await supabase
    .from("cleanup_jobs")
    .insert({
      job_type: "analysis_temp_cleanup",
      details: { thresholdMinutes, cutoff },
    })
    .select("id")
    .single();

  if (jobError || !job?.id) {
    throw jobError ?? new Error("Failed to record cleanup job");
  }

  const jobId: string = job.id as string;
  const summary = {
    scanned: 0,
    removed: 0,
    skipped: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  try {
    const { data: uploads, error: uploadsError } = await supabase
      .from("uploads")
      .select("id, storage_path, created_at")
      .lte("created_at", cutoff);

    if (uploadsError) {
      throw uploadsError;
    }

    const rows: UploadRow[] = uploads ?? [];
    summary.scanned = rows.length;
    const idsToDelete: string[] = [];

    for (const row of rows) {
      if (!row.storage_path) {
        summary.skipped += 1;
        continue;
      }
      const [bucket, ...pathParts] = row.storage_path.split("/");
      if (!bucket || pathParts.length === 0) {
        summary.skipped += 1;
        continue;
      }
      const objectPath = pathParts.join("/");
      try {
        const { error: removeError } = await supabase.storage.from(bucket).remove([objectPath]);
        if (removeError) {
          throw removeError;
        }
        idsToDelete.push(row.id);
        summary.removed += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ id: row.id, error: message });
      }
    }

    if (idsToDelete.length > 0) {
      await supabase.from("uploads").delete().in("id", idsToDelete);
    }

    await supabase
      .from("cleanup_jobs")
      .update({
        finished_at: new Date().toISOString(),
        success: summary.errors.length === 0,
        details: { ...summary, cutoff, thresholdMinutes },
      })
      .eq("id", jobId);

    if (summary.errors.length > 0) {
      console.warn("Cleanup finished with errors", summary);
      process.exitCode = 1;
    } else {
      console.log("Cleanup finished", summary);
    }
  } catch (error) {
    console.error("Cleanup failed", error);
    await supabase
      .from("cleanup_jobs")
      .update({
        finished_at: new Date().toISOString(),
        success: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          ...summary,
        },
      })
      .eq("id", jobId);
    process.exit(1);
  }
}

run();

