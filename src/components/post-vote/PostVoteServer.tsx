import { getAuthSession } from "@/lib/auth";
import { Post, Vote, VoteType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import PostVoteClient from "./PostVoteClient";

interface PostVoteServerProps {
  postId: string;
  initialVoteAmount?: number;
  initialVote?: VoteType | null;
  getData?: () => Promise<(Post & { votes: Vote[] }) | null>;
}

// const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const PostVoteServer = async ({
  postId,
  initialVoteAmount,
  initialVote,
  getData,
}: PostVoteServerProps) => {
  const session = await getServerSession();

  let _voteAmount: number = 0;
  let _currentVote: VoteType | null | undefined = undefined;

  if (getData) {

    const post = await getData();
    if (!post) return notFound();

    _voteAmount = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);

    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user.id
    )?.type;
  } else {
    _voteAmount = initialVoteAmount!;
    _currentVote = initialVote;
  }

  return (
    <>
      <PostVoteClient
        postId={postId}
        initialVoteAmount={_voteAmount}
        initialVote={_currentVote}
      />
    </>
  );
};

export default PostVoteServer;
