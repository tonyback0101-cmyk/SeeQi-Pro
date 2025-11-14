import { createClient } from "@supabase/supabase-js";

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
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: job, error: jobError } = await supabase
    .from("cleanup_jobs")
    .insert({
      job_type: "expired_reports_cleanup",
      details: { cutoff: nowIso },
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
    errors: [] as Array<{ id: string; error: string }>,
  };

  try {
    const { data: reports, error: selectError } = await supabase
      .from("reports")
      .select("id")
      .lte("expires_at", nowIso);

    if (selectError) {
      throw selectError;
    }

    const ids = (reports ?? []).map((item) => item.id as string);
    summary.scanned = ids.length;

    if (ids.length > 0) {
      const { error: deleteError } = await supabase.from("reports").delete().in("id", ids);
      if (deleteError) {
        throw deleteError;
      }
      summary.removed = ids.length;
    }

    await supabase
      .from("cleanup_jobs")
      .update({
        finished_at: new Date().toISOString(),
        success: true,
        details: { ...summary, cutoff: nowIso },
      })
      .eq("id", jobId);

    console.log("Expired reports cleanup finished", summary);
  } catch (error) {
    console.error("Expired reports cleanup failed", error);
    await supabase
      .from("cleanup_jobs")
      .update({
        finished_at: new Date().toISOString(),
        success: false,
        details: {
          ...summary,
          error: error instanceof Error ? error.message : String(error),
          cutoff: nowIso,
        },
      })
      .eq("id", jobId);
    process.exit(1);
  }
}

run();

