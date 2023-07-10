import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redits";
import { PostVoteValidator } from "@/lib/validator/vote";
import { CachedPost } from "@/types/redis";
import { title } from "process";
import { json } from "stream/consumers";
import { z } from "zod";

const CACHE_AFTER_UPVOTES = 1;

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { postId, voteType } = PostVoteValidator.parse(body);
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const existingVote = await db.vote.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    if (existingVote) {
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: {
            userId_postId: {
              postId,
              userId: session.user.id,
            },
          },
        });
        return new Response("OK");
      }
      await db.vote.update({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
        data: {
          type: voteType,
        },
      });
      //   recount the votes
      const votesAmount = post.votes.reduce((acc, vote) => {
        if (vote.type === "UP") return acc + 1;
        if (vote.type === "DOWN") return acc - 1;
        return acc;
      }, 0);
      if (votesAmount >= CACHE_AFTER_UPVOTES) {
        const cachedPayload: CachedPost = {
          authorUsername: post.author.username || "",
          content: JSON.stringify(post.content),
          id: post.id,
          title: post.title,
          currentVote: voteType,
          createdAt: post.createdAt,
        };
        await redis.hset(`post:${postId}`, cachedPayload);
      }
      return new Response("Ok");
    }

    await db.vote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        postId,
      },
    });
    const votesAmount = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);
    if (votesAmount >= CACHE_AFTER_UPVOTES) {
      const cachedPayload: CachedPost = {
        authorUsername: post.author.username || "",
        content: JSON.stringify(post.content),
        id: post.id,
        title: post.title,
        currentVote: voteType,
        createdAt: post.createdAt,
      };
      await redis.hset(`post:${postId}`, cachedPayload);
    }
    return new Response("Ok");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid data request data passed", { status: 422 });
    }
    return new Response("Could not register your vote please try again later", {
      status: 500,
    });
  }
}
