"use client";

import { useCustomToast } from "@/hooks/useCustomToast";
import { usePrevious } from "@mantine/hooks";
import { VoteType } from "@prisma/client";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { PostVoteRequest } from "@/lib/validator/vote";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/useToast";
import { type } from "os";

interface PostVoteClientProps {
  postId: string;
  initialVoteAmount: number;
  initialVote?: VoteType | null;
}

const PostVoteClient: React.FC<PostVoteClientProps> = ({
  postId,
  initialVoteAmount,
  initialVote,
}) => {
  const { loginToast } = useCustomToast();
  const [votesAmount, setVotesAmount] = useState<number>(initialVoteAmount);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  useEffect(() => {
    setCurrentVote(initialVote);
  }, [initialVote]);

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      const payload: PostVoteRequest = {
        postId,
        voteType,
      };
      await axios.patch("/api/subreddit/post/vote", payload);
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
    onMutate: (type: VoteType) => {
      if (currentVote === type) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(undefined);
        if (type === "UP") setVotesAmount((prev) => prev - 1);
        else if (type === "DOWN") setVotesAmount((prev) => prev + 1);
      } else {
        // User is voting in the opposite direction, so subtract 2
        setCurrentVote(type);
        if (type === "UP")
          setVotesAmount((prev) => prev + (currentVote ? 2 : 1));
        else if (type === "DOWN")
          setVotesAmount((prev) => prev - (currentVote ? 2 : 1));
      }
    },
  });

  return (
    <>
      <div className="flex sm:flex-col gap-4 sm:gap-0 pr-6 sm:w-20 pb-4 sm:pb-0">
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
              "text-emerald-500 fill-emerald-500": currentVote === "UP",
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
              "text-red-500 fill-red-500": currentVote === "DOWN",
            })}
          />
        </Button>
      </div>
    </>
  );
};

export default PostVoteClient;
