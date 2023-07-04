import { db } from "@/lib/db";

export default async function getMemberCountByName(subredditName: string) {
  const memeberCount = await db.subscription.count({
    where: {
      Subreddit: {
        name: subredditName,
      },
    },
  });
  return memeberCount;
}
