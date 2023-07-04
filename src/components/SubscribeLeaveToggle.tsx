"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/Button";
import { SubscribeToSubredditPayload } from "@/lib/validator/subreddit";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/useCustomToast";
import { toast } from "@/hooks/useToast";
import { startTransition } from "react";
import { useRouter } from "next/navigation";

interface SubscribeLeaveToggleProps {
  subredditId: string;
  subredditName: string;
  isSubscribed: boolean;
}

function SubscribeLeaveToggle({
  subredditId,
  subredditName,
  isSubscribed,
}: SubscribeLeaveToggleProps) {
  const router = useRouter();
  const { loginToast } = useCustomToast();

  const { mutate: subscribe, isLoading: isSubscribingLoading } = useMutation({
    mutationFn: async () => {
      const payload: SubscribeToSubredditPayload = {
        subredditId: subredditId,
      };
      const { data } = await axios.post("/api/subreddit/subscribe", payload);
      return data as string;
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
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
      startTransition(() => {
        router.refresh();
      });
      return toast({
        title: "Subscribed",
        description: `You are now subscribed to r/${subredditName}`,
      });
    },
  });
  const { mutate: unsubscribe, isLoading: isUnubscribingLoading } = useMutation(
    {
      mutationFn: async () => {
        const payload: SubscribeToSubredditPayload = {
          subredditId: subredditId,
        };
        const { data } = await axios.post(
          "/api/subreddit/unsubscribe",
          payload
        );
        return data as string;
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (error.response?.status === 401) {
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
        startTransition(() => {
          router.refresh();
        });
        return toast({
          title: "Unubscribed",
          description: `You are now unsubscribed from r/${subredditName}`,
        });
      },
    }
  );

  return isSubscribed ? (
    <Button
      onClick={() => unsubscribe()}
      isLoading={isUnubscribingLoading}
      className="w-full mt-1 mb-4"
    >
      Leave community
    </Button>
  ) : (
    <Button
      onClick={() => subscribe()}
      isLoading={isSubscribingLoading}
      className="w-full mt-1 mb-4"
    >
      Join to post
    </Button>
  );
}

export default SubscribeLeaveToggle;
