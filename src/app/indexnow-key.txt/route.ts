import { INDEXNOW_KEY } from "@/lib/indexnow-payload";

export const runtime = "nodejs";

export function GET() {
  return new Response(`${INDEXNOW_KEY}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
