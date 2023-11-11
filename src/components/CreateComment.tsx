"use client";

import { useState } from "react";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/TextArea";
import { Button } from "./ui/Button";
import { useMutation } from "@tanstack/react-query";
import { CommentRequest } from "@/lib/validator/comment";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/useCustomToast";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { create } from "domain";

interface CreateCommentProps {
  postId: string;
  replyToId?: string;
}

const CreateComment: React.FC<CreateCommentProps> = ({ postId, replyToId }) => {
  const [input, setInput] = useState<string>("");
  const { loginToast } = useCustomToast();
  const router = useRouter();
  const { mutate: createComment, isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = {
        postId,
        text,
        replyToId,
      };
      const { data } = await axios.patch(
        `/api/subreddit/post/comment`,
        payload
      );
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          return loginToast();
        }
      }
      return toast({
        title: "There was a problem",
        description: "Something went wrong please try again later",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      router.refresh();
      setInput("");
    },
  });
  return (
    <>
      <div className="grid w-full gap-1.5 ">
        <Label htmlFor="comment">Your comment</Label>
        <div className="mt-2">
          <Textarea
            id="comment"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder="What are yout thoughts?"
          />
          <div className="mt-2 flex justify-end">
            <Button
              isLoading={isLoading}
              disabled={input.length === 0}
              onClick={() =>
                createComment({
                  postId,
                  text: input,
                  replyToId,
                })
              }
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateComment;
