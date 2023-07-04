import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Session } from "next-auth";

export default async function getSubscriptionByName(
  session: Session | null,
  subredditName: string
) {
  const subscription = !session?.user
    ? undefined
    : await db.subscription.findFirst({
        where: {
          Subreddit: {
            name: subredditName,
          },
          user: {
            id: session.user.id,
          },
        },
      });
  return subscription;
}
