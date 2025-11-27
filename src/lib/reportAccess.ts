import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;
type SupportedLocale = "zh" | "en";

type LegacyEnsureResult = {
  ok: boolean;
  alreadyExists?: boolean;
  error?: unknown;
};

type GrantAccessResult = {
  ok: boolean;
  action?: "insert" | "update";
  error?: unknown;
};

const safeJson = (value: unknown) => {
  if (value === undefined) return undefined;
  return value ?? null;
};

export async function ensureLegacyReportRow({
  supabase,
  reportId,
  report,
  locale,
}: {
  supabase: SupabaseClient | null;
  reportId: string;
  report?: AnalysisV2Result | null;
  locale?: SupportedLocale;
}): Promise<LegacyEnsureResult> {
  if (!supabase || !reportId) {
    return { ok: false, error: new Error("Missing Supabase client or reportId") };
  }

  try {
    const { data, error } = await supabase.from("reports").select("id").eq("id", reportId).maybeSingle();
    if (error && error.code !== "PGRST116") {
      console.warn("[ensureLegacyReportRow] Failed to query reports table", { reportId, error });
    }
    if (data?.id) {
      return { ok: true, alreadyExists: true };
    }
  } catch (error) {
    console.warn("[ensureLegacyReportRow] Exception when checking reports table", error);
  }

  const legacyLocale = report?.locale ?? locale ?? "zh";
  const normalized = report?.normalized ?? null;
  const constitution = normalized?.constitution ?? report?.constitution;
  const advice = normalized?.advice ?? report?.advice;
  const dream = normalized?.dream_insight ?? report?.dream_insight;
  const qiRhythm = normalized?.qi_rhythm ?? report?.qi_rhythm;
  const qiIndex = qiRhythm?.qi_index ?? null;
  const solarTerm = qiRhythm?.solar_term ?? null;

  const payload: Record<string, any> = {
    id: reportId,
    created_at: report?.created_at ?? new Date().toISOString(),
    locale: legacyLocale,
    unlocked: true,
    constitution: safeJson(constitution),
    advice: safeJson(advice),
    dream: safeJson(dream),
    qi_index: safeJson(qiIndex),
    solar_term: safeJson(solarTerm),
  };

  const sanitizedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  const { error: upsertError } = await supabase
    .from("reports")
    .upsert(sanitizedPayload, { onConflict: "id" });

  if (upsertError) {
    console.error("[ensureLegacyReportRow] Failed to upsert reports row", upsertError);
    return { ok: false, error: upsertError };
  }

  return { ok: true, alreadyExists: false };
}

export async function grantFullReportAccess({
  supabase,
  reportId,
  userId,
  report,
  locale,
  tier = "full",
}: {
  supabase: SupabaseClient | null;
  reportId: string;
  userId: string;
  report?: AnalysisV2Result | null;
  locale?: SupportedLocale;
  tier?: string;
}): Promise<GrantAccessResult> {
  if (!supabase || !reportId || !userId) {
    return { ok: false, error: new Error("Missing Supabase client, reportId, or userId") };
  }

  const legacyResult = await ensureLegacyReportRow({ supabase, reportId, report, locale });
  if (!legacyResult.ok) {
    return { ok: false, error: legacyResult.error ?? new Error("ensureLegacyReportRow failed") };
  }

  const { data: existingAccess, error: accessQueryError } = await supabase
    .from("report_access")
    .select("id")
    .eq("user_id", userId)
    .eq("report_id", reportId)
    .maybeSingle();

  if (accessQueryError && accessQueryError.code !== "PGRST116") {
    console.error("[grantFullReportAccess] Failed to query report_access", accessQueryError);
    return { ok: false, error: accessQueryError };
  }

  if (existingAccess) {
    const { error: updateError } = await supabase
      .from("report_access")
      .update({ tier })
      .eq("user_id", userId)
      .eq("report_id", reportId);

    if (updateError) {
      console.error("[grantFullReportAccess] Failed to update report_access", updateError);
      return { ok: false, error: updateError };
    }

    return { ok: true, action: "update" };
  }

  const { error: insertError } = await supabase
    .from("report_access")
    .insert({
      user_id: userId,
      report_id: reportId,
      tier,
    });

  if (insertError) {
    console.error("[grantFullReportAccess] Failed to insert report_access", insertError);
    return { ok: false, error: insertError };
  }

  return { ok: true, action: "insert" };
}

