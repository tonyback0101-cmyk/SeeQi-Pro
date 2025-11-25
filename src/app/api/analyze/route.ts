export const runtime = "nodejs";

export async function POST() {
  return new Response(JSON.stringify({ error: "SeeQi V1 analyze API disabled" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
}
