"use client";

import { useCustomToast } from "@/hooks/useCustomToast";
import { usePrevious } from "@mantine/hooks";
import { CommentVote, VoteType } from "@prisma/client";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { CommentVoteRequest, PostVoteRequest } from "@/lib/validator/vote";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/useToast";
import { type } from "os";
import { string } from "zod";

interface CommentVotesProps {
  commentId: string;
  initialVoteAmount: number;
  initialVote?: Pick<CommentVote, "type"> | undefined | null;
}

const CommentVotes: React.FC<CommentVotesProps> = ({
  commentId,
  initialVoteAmount,
  initialVote,
}) => {
  const { loginToast } = useCustomToast();
  const [votesAmount, setVotesAmount] = useState<number>(initialVoteAmount);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      const payload: CommentVoteRequest = {
        commentId,
        voteType,
      };
      await axios.patch("/api/subreddit/post/comment/vote", payload);
    },
    onError: (error, voteType) => {
      if (voteType === "UP") setVotesAmount((prev) => prev - 1);
      else setVotesAmount((prev) => prev + 1);
      //   reset the current vote
      setCurrentVote(prevVote);
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          return loginToast();
        }
        return toast({
          title: "something went wrong",
          description: "your post was not registered please try again later",
          variant: "destructive",
        });
      }
    },
    onMutate: (type) => {
      if (currentVote?.type === type) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(undefined);
        if (type === "UP") setVotesAmount((prev) => prev - 1);
        else if (type === "DOWN") setVotesAmount((prev) => prev + 1);
      } else {
        // User is voting in the opposite direction, so subtract 2
        setCurrentVote({ type });
        if (type === "UP")
          setVotesAmount((prev) => prev + (currentVote ? 2 : 1));
        else if (type === "DOWN")
          setVotesAmount((prev) => prev - (currentVote ? 2 : 1));
      }
    },
  });

  return (
    <>
      <div className="flex gap-1">
        <Button
          onClick={() => {
            vote("UP");
          }}
          size={"sm"}
          variant={"ghost"}
          aria-label="upvote"
        >
          <ArrowBigUp
            className={cn("h-5 w-5 text-zinc-700", {
              "text-emerald-500 fill-emerald-500": currentVote?.type === "UP",
            })}
          />
        </Button>
        <p className="text-center py-2 font-medium text-sm text-zinc-900">
          {votesAmount}
        </p>
        <Button
          onClick={() => {
            vote("DOWN");
          }}
          size={"sm"}
          variant={"ghost"}
          aria-label="downvote"
        >
          <ArrowBigDown
            className={cn("h-5 w-5 text-zinc-700", {
              "text-red-500 fill-red-500": currentVote?.type === "DOWN",
            })}
          />
        </Button>
      </div>
    </>
  );
};

export default CommentVotes;
