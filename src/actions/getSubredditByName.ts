import { db } from "@/lib/db";

export default async function getSubredditByName(subredditName: string) {
  const subreddit = await db.subreddit.findFirst({
    where: {
      name: subredditName,
    },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
        },
      },
    },
  });
  return subreddit;
}
