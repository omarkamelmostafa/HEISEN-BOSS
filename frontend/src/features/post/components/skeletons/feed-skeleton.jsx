"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCardSkeleton } from "./post-card-skeleton";

/**
 * FeedSkeleton - Loading state for the feed page.
 * Composite skeleton with create post area and post card placeholders.
 */
export function FeedSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Create Post Area Placeholder */}
      <Card className="w-full border-muted/50 bg-card/60 backdrop-blur-md shadow-sm">
        <CardHeader className="pb-3 border-b border-muted/20">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-[120px] w-full" />
          <div className="flex justify-end pt-2">
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Post Card Skeletons */}
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
}
