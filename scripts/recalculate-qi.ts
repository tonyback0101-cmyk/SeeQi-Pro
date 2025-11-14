import process from "node:process";
import { getSupabaseAdminClient } from "../src/lib/supabaseAdmin";
import { computeQiIndex, type QiIndexInputs } from "../src/lib/analysis/qiIndex";

type ReportRow = {
  id: string;
  constitution: string | null;
  palm_result: Record<string, unknown> | null;
  tongue_result: Record<string, unknown> | null;
  dream: Record<string, unknown> | null;
  solar_term: string | null;
  matched_rules: string[] | null;
  qi_index: Record<string, unknown> | null;
  created_at: string | null;
  locale: string | null;
};

async function resolveSolar(_: ReturnType<typeof getSupabaseAdminClient>, name: string | null) {
  if (!name) return null;
  return {
    code: null,
    name,
    element: null,
  };
}

function buildInputs(report: ReportRow, solar: Awaited<ReturnType<typeof resolveSolar>>) {
  const readNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };
  const inputs: QiIndexInputs = {
    constitution: report.constitution ?? undefined,
    palm: report.palm_result
      ? {
          qualityScore: readNumber(report.palm_result?.qualityScore ?? report.palm_result?.quality_score),
          color: (report.palm_result?.color as string) ?? undefined,
          texture: (report.palm_result?.texture as string) ?? undefined,
          lines: (report.palm_result?.lines as Record<string, string>) ?? undefined,
        }
      : undefined,
    tongue: report.tongue_result
      ? {
          qualityScore: readNumber(report.tongue_result?.qualityScore ?? report.tongue_result?.quality_score),
          color: (report.tongue_result?.color as string) ?? undefined,
          coating: (report.tongue_result?.coating as string) ?? undefined,
          texture: (report.tongue_result?.texture as string) ?? undefined,
        }
      : undefined,
    dream: report.dream
      ? {
          emotion: (report.dream?.emotion as string) ?? undefined,
          keywords: Array.isArray(report.dream?.keywords)
            ? (report.dream?.keywords as string[])
            : undefined,
        }
      : undefined,
    matchedRules: Array.isArray(report.matched_rules) ? report.matched_rules : undefined,
    solar: solar
      ? {
          code: solar.code ?? undefined,
          name: solar.name ?? undefined,
          element: solar.element ?? undefined,
        }
      : undefined,
  };
  return inputs;
}

async function main() {
  const client = getSupabaseAdminClient();

  const PAGE_SIZE = 100;
  let page = 0;
  let totalUpdated = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client
      .from("reports")
      .select(
        "id,constitution,palm_result,tongue_result,dream,solar_term,matched_rules,qi_index,created_at,locale",
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    const batch = (data as ReportRow[]).filter((report) => {
      const total = (report.qi_index as { total?: number } | null)?.total;
      return typeof total !== "number" || Number.isNaN(total);
    });

    if (batch.length === 0) {
      console.log(`Page ${page + 1}: no missing qi_index found, skipping.`);
    } else {
      console.log(`Page ${page + 1}: recalculating ${batch.length} reports...`);
      for (const report of batch) {
        try {
          const solar = await resolveSolar(client, report.solar_term);
          const inputs = buildInputs(report, solar);
          const qi = computeQiIndex(inputs);
          await client.from("reports").update({ qi_index: qi }).eq("id", report.id);
          totalUpdated += 1;
          console.log(`  ✓ ${report.id} -> ${qi.total}`);
        } catch (err) {
          console.error(`  ✗ ${report.id} failed:`, err);
        }
      }
    }

    if (data.length < PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  if (totalUpdated === 0) {
    console.log("All reports already contain qi_index. No action needed.");
  } else {
    console.log(`Recalculation completed. Updated ${totalUpdated} reports.`);
  }
}

main().catch((err) => {
  console.error("Failed to recalculate qi_index", err);
  process.exitCode = 1;
});

