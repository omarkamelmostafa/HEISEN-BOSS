// frontend/src/features/post/components/post-card.jsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent, CardFooter, CardAction } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Repeat,
  Trash2,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PostCard - Presentational component for displaying a post.
 * Following "dumb component" pattern: no API calls, no navigation, no Redux.
 */
export function PostCard({
  post,
  isLiked = false,
  currentUserId,
  onLike,
  onComment,
  onRepost,
  onDelete,
  onEdit,
}) {
  const t = useTranslations("posts");
  const { author, content, image, likesCount, commentsCount, repostsCount } = post;

  const authorName = author
    ? `${author.firstname || ""} ${author.lastname || ""}`.trim() || author.email || author._id
    : t("card.unknownAuthor");

  const isAuthor = currentUserId === author?._id;

  return (
    <Card className="w-full overflow-hidden border-muted/60 bg-card/50 backdrop-blur-sm transition-all hover:border-muted-foreground/20">
      <CardHeader className="flex-row items-center gap-4 px-6 py-4">
        <Avatar className="h-10 w-10 border border-muted shadow-sm">
          {author?.avatar?.url && (
            <AvatarImage
              src={author.avatar.url}
              alt={authorName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase pointer-events-none">
            {authorName.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col justify-center overflow-hidden">
          <span className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground/90">
            {authorName}
          </span>
        </div>

        {isAuthor && (
          <CardAction className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              onClick={() => onEdit?.(post._id)}
              disabled={!onEdit}
              aria-label={t("card.edit")}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              onClick={() => onDelete?.(post._id)}
              disabled={!onDelete}
              aria-label={t("card.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="px-6 py-0 pb-4">
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/80">
            {content}
          </p>
          {image && (
            <div className="relative mt-2 overflow-hidden rounded-xl border border-muted/50 bg-muted/20">
              <img
                src={image}
                alt={t("card.imageAlt")}
                className="max-h-[512px] w-full object-cover transition-transform hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-muted/30 px-4 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex h-9 items-center gap-2 px-3 text-muted-foreground transition-colors",
              isLiked && "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            )}
            onClick={() => onLike?.(post._id)}
            disabled={!onLike}
            aria-label={t("card.like")}
          >
            <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
            {likesCount > 0 && <span className="text-xs font-medium">{likesCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex h-9 items-center gap-2 px-3 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            onClick={() => onComment?.(post._id)}
            disabled={!onComment}
            aria-label={t("card.comment")}
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {commentsCount > 0 && <span className="text-xs font-medium">{commentsCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex h-9 items-center gap-2 px-3 text-muted-foreground transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20"
            onClick={() => onRepost?.(post._id)}
            disabled={!onRepost}
            aria-label={t("card.repost")}
          >
            <Repeat className="h-[18px] w-[18px]" />
            {repostsCount > 0 && <span className="text-xs font-medium">{repostsCount}</span>}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
