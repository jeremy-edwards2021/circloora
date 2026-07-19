export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET(): Promise<Response> {
  return Response.json(
    {
      status: "ok",
      version: "0.1.0",
      mockMode: true,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1_000),
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store, no-transform",
        "x-robots-tag": "noindex",
      },
    },
  );
}
