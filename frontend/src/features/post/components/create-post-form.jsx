// frontend/src/features/post/components/create-post-form.jsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/features/auth/components/forms/form-textarea";
import { Loader2, SendHorizontal } from "lucide-react";

/**
 * CreatePostForm - Dumb component for post creation.
 * Connected to React Hook Form via form context.
 */
export function CreatePostForm({ onSubmit, isSubmitting }) {
  const t = useTranslations("posts");
  const { handleSubmit } = useFormContext();

  return (
    <Card className="w-full border-muted/50 bg-card/60 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3 border-b border-muted/20">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground/90">
          {t("create.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormTextarea
            name="content"
            placeholder={t("create.placeholder")}
            className="w-full font-medium"
            inputClassName="min-h-[120px] resize-none border-muted/60 focus:border-primary/40 focus:ring-primary/20 text-foreground/90 leading-relaxed"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("create.submitting")}
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {t("create.submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
