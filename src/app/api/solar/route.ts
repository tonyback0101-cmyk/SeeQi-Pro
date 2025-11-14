import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { resolveSolarTermCode } from "@/lib/solar/resolve";
import { getSolarTermInsight } from "@/data/solarTerms";

type Locale = "zh" | "en";

function normaliseLocale(input: string | null): Locale {
  if (input?.toLowerCase() === "en") {
    return "en";
  }
  return "zh";
}

function parseDateInTimezone(dateParam: string | null, tz: string): Date | null {
  const base = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(formatter.formatToParts(base).map((part) => [part.type, part.value]));
  } catch {
    return null;
  }

  const year = Number.parseInt(parts.year ?? "", 10);
  const month = Number.parseInt(parts.month ?? "", 10);
  const day = Number.parseInt(parts.day ?? "", 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const tz = url.searchParams.get("tz") ?? "Asia/Shanghai";
  const locale = normaliseLocale(url.searchParams.get("locale"));

  const zonedDate = parseDateInTimezone(dateParam, tz);
  if (!zonedDate) {
    return NextResponse.json({ error: "非法时区或日期参数" }, { status: 400 });
  }

  const code = resolveSolarTermCode(zonedDate);

  try {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from("dict_solar_term")
      .select("code,name_zh,name_en,do_zh,avoid_zh,do_en,avoid_en,element,health_tip")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      const insight = getSolarTermInsight(locale, code as any);
      const doList = ((locale === "en" ? data.do_en : data.do_zh) ?? insight.favorable) ?? [];
      const avoidList = ((locale === "en" ? data.avoid_en : data.avoid_zh) ?? insight.avoid) ?? [];
      const advice =
        locale === "zh"
          ? {
              宜: doList,
              忌: avoidList,
            }
          : {
              do: doList,
              avoid: avoidList,
            };

      return NextResponse.json(
        {
          code: data.code,
          name: locale === "en" ? data.name_en : data.name_zh,
          do: doList,
          avoid: avoidList,
          element: data.element ?? null,
          health_tip: data.health_tip ?? insight.description,
          qi_luck_index: insight.qiIndex,
          qi_phrase: insight.qiPhrase,
          warning: insight.qiWarning,
          advice,
          food: insight.diet,
          activity: insight.routine,
          emoji: insight.emoji,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=3600",
          },
        },
      );
    }
  } catch (error) {
    console.error("[GET /api/solar] fallback due to error:", error);
  }

  const fallback = getSolarTermInsight(locale, code as any);
  const fallbackAdvice =
    locale === "zh"
      ? {
          宜: fallback.favorable,
          忌: fallback.avoid,
        }
      : {
          do: fallback.favorable,
          avoid: fallback.avoid,
        };
  return NextResponse.json(
    {
      code: fallback.key,
      name: fallback.name,
      do: fallback.favorable,
      avoid: fallback.avoid,
      element: null,
      health_tip: fallback.description,
      qi_luck_index: fallback.qiIndex,
      qi_phrase: fallback.qiPhrase,
      warning: fallback.qiWarning,
      advice: fallbackAdvice,
      food: fallback.diet,
      activity: fallback.routine,
      emoji: fallback.emoji,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=3600",
      },
    },
  );
}

