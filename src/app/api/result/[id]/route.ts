export const runtime = "nodejs";

export async function GET() {
  return new Response(JSON.stringify({ error: "SeeQi V1 result API disabled" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
}
