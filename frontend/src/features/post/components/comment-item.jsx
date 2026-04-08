// frontend/src/features/post/components/comment-item.jsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/**
 * CommentItem - Presentational component for displaying a single comment.
 * No dangerouslySetInnerHTML, no API/Redux logic. Matches PostCard design.
 */
export function CommentItem({
  comment,
  isAuthor,
  onDelete,
}) {
  const t = useTranslations("posts");
  const { author, content, _id } = comment;

  const authorName = author
    ? `${author.firstname || ""} ${author.lastname || ""}`.trim() || t("card.unknownAuthor")
    : t("card.unknownAuthor");

  return (
    <div className="group flex gap-4 transition-all duration-300">
      <Avatar className="h-10 w-10 border border-muted ring-2 ring-transparent transition-all group-hover:ring-primary/10">
        {author?.avatar?.url && (
          <AvatarImage 
            src={author.avatar.url} 
            alt={authorName} 
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
          {authorName.substring(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground/90">
            {authorName}
          </span>
          
          {isAuthor && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              onClick={() => onDelete?.(_id)}
              aria-label={t("card.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="rounded-2xl rounded-tl-none bg-muted/40 px-4 py-3 ring-1 ring-inset ring-muted/20 backdrop-blur-[2px] transition-colors group-hover:bg-muted/50">
          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/80">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}
