// frontend/src/features/post/components/skeletons/post-card-skeleton.jsx
"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * PostCardSkeleton - Loading state for PostCard.
 */
export function PostCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden border-muted/40 bg-card/40 backdrop-blur-sm shadow-none">
      <CardHeader className="flex-row items-center gap-4 px-6 py-4">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      <CardContent className="px-6 py-0 pb-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[45%]" />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl">
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-6 border-t border-muted/20 px-6 py-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}
