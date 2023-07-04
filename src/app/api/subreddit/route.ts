import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditValidator } from "@/lib/validator/subreddit";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorizes", { status: 401 });
    }
    const body = await request.json();
    const { name } = SubredditValidator.parse(body);
    const subredditExist = await db.subreddit.findFirst({
      where: {
        name,
      },
    });
    if (subredditExist) {
      return new Response("Subreddit Already exists", { status: 409 });
    }
    const subreddit = await db.subreddit.create({
      data: { name, creatorId: session.user.id },
    });
    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: subreddit.id,
      },
    });
    return new Response(subreddit.name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }
    return new Response("Could not create subreddit", { status: 500 });
  }
}
