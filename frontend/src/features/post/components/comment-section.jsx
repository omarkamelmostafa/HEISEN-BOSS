// frontend/src/features/post/components/comment-section.jsx
"use client";

import React from "react";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";

import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

/**
 * CommentSection - Presentational component for the comments section.
 * Purely presentational: no Redux, no API calls, no navigation.
 * Composes CommentForm and CommentItem with proper separators.
 */
export function CommentSection({
  comments,
  currentUserId,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSubmit,
  onDelete,
  isSubmitting = false,
}) {
  const t = useTranslations("posts");
  const hasComments = comments?.length > 0;

  return (
    <section className="flex flex-col gap-4" aria-label={t("comments.title")}>
      {/* Section Title */}
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {t("comments.title")}
      </h3>

      {/* Comment Form */}
      <CommentForm onSubmit={onSubmit} isSubmitting={isSubmitting} />

      <Separator className="my-2" />

      {/* Loading State (when no comments yet) */}
      {isLoading && !hasComments && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasComments && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("comments.noComments")}
        </p>
      )}

      {/* Comments List */}
      {hasComments && (
        <div className="flex flex-col">
          {comments.map((comment, index) => (
            <React.Fragment key={comment._id || index}>
              <CommentItem
                comment={comment}
                isAuthor={currentUserId === comment.author?._id}
                onDelete={onDelete}
              />
              {index < comments.length - 1 && <Separator className="my-4" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <>
          {hasComments && <Separator className="my-4" />}
          <button
            type="button"
            onClick={onLoadMore}
            className="self-center text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("comments.loadMore")}
          </button>
        </>
      )}
    </section>
  );
}
