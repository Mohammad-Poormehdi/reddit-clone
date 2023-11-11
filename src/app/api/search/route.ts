import { db } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParam = url.searchParams.get("query");
  if (!queryParam) {
    return new Response("Invalid query", { status: 400 });
  }
  const results = await db.subreddit.findMany({
    where: {
      name: { startsWith: queryParam },
    },
    include: {
      _count: true,
    },
    take: 5,
  });
  return new Response(JSON.stringify(results));
}
