import process from "node:process";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY 均需配置才能巡检订单状态。");
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await client.from("vw_orders_pending_long").select("id,report_id,created_at");
  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    console.log("[health-check] 所有订单均正常，无超过 1 小时的 pending 记录。");
    return;
  }

  console.warn(`[health-check] 检测到 ${data.length} 条 pending 订单超过 1 小时：`);
  data.forEach((row) => {
    console.warn(`- order_id=${row.id} report_id=${row.report_id} created_at=${row.created_at}`);
  });
  throw new Error("存在长时间未完成的订单，请尽快排查。");
}

main().catch((error) => {
  console.error("[health-check] 任务失败：", error);
  process.exitCode = 1;
});

