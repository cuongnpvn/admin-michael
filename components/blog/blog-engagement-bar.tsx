"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import {
  incrementBlogShare,
  toggleBlogLike,
} from "@/lib/blog/actions";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

interface BlogEngagementBarProps {
  postId: string;
  slug: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  initialLiked: boolean;
  isSignedIn: boolean;
  preview?: boolean;
  layout?: "rail" | "row";
}

export function BlogEngagementBar({
  postId,
  slug,
  likeCount: initialLikeCount,
  commentCount,
  shareCount: initialShareCount,
  initialLiked,
  isSignedIn,
  preview = false,
  layout = "rail",
}: BlogEngagementBarProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [authOpen, setAuthOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  function handleLike() {
    if (preview) return;
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }

    startTransition(async () => {
      const result = await toggleBlogLike(postId, slug);
      if (!result.ok) return;
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    });
  }

  async function handleShare() {
    if (preview) return;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage(copy.home.blog.shareCopied);
        window.setTimeout(() => setShareMessage(null), 2000);
      }
    } catch {
      // User cancelled share sheet or clipboard failed silently.
    }

    startTransition(async () => {
      const result = await incrementBlogShare(postId, slug);
      if (result.ok) {
        setShareCount(result.shareCount);
      }
    });
  }

  function handleComments() {
    if (preview) return;
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  }

  const isRail = layout === "rail";

  return (
    <>
      <div
        className={cn(
          isRail
            ? "flex flex-col items-center gap-4"
            : "flex flex-wrap items-center gap-4",
        )}
      >
        <EngagementAction
          label={liked ? copy.home.blog.liked : copy.home.blog.like}
          count={likeCount}
          countLabel={copy.home.blog.likes(likeCount)}
          active={liked}
          disabled={preview || isPending}
          layout={layout}
          onClick={handleLike}
        >
          <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
        </EngagementAction>

        <EngagementAction
          label={copy.home.blog.commentsTitle}
          count={commentCount}
          countLabel={copy.home.blog.comments(commentCount)}
          disabled={preview}
          layout={layout}
          onClick={handleComments}
        >
          <MessageCircle className="size-4" aria-hidden />
        </EngagementAction>

        <EngagementAction
          label={copy.home.blog.share}
          count={shareCount}
          countLabel={copy.home.blog.shares(shareCount)}
          disabled={preview || isPending}
          layout={layout}
          onClick={() => {
            void handleShare();
          }}
        >
          <Share2 className="size-4" aria-hidden />
        </EngagementAction>
      </div>

      {shareMessage && !isRail ? (
        <p className="mt-2 text-sm text-muted-foreground">{shareMessage}</p>
      ) : null}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

function EngagementAction({
  label,
  count,
  countLabel,
  active = false,
  disabled,
  layout,
  onClick,
  children,
}: {
  label: string;
  count: number;
  countLabel: string;
  active?: boolean;
  disabled: boolean;
  layout: "rail" | "row";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${label} · ${countLabel}`}
      className={cn(
        "inline-flex items-center text-muted-foreground transition-calm",
        "hover:text-foreground disabled:pointer-events-none disabled:opacity-60",
        layout === "rail"
          ? "flex-col gap-1"
          : "gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm",
        active && "text-primary",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center",
          layout === "rail" &&
            "size-11 rounded-full border border-border bg-surface shadow-soft",
          active && layout === "rail" && "border-primary/40 bg-primary/10",
        )}
      >
        {children}
      </span>
      <span className="tabular-nums text-xs">{count}</span>
    </button>
  );
}
