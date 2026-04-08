// frontend/src/features/post/components/comment-form.jsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FormTextarea } from "@/features/auth/components/forms/form-textarea";
import { Button } from "@/components/ui/button";

/**
 * CommentForm - Dumb component for submitting a comment.
 * Follows constraints: presentational only, no Redux, no API, no direct sonner.
 */
export function CommentForm({ onSubmit, isSubmitting = false }) {
  const t = useTranslations("posts");
  const { handleSubmit } = useFormContext();

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="flex flex-col gap-3"
      noValidate
    >
      <FormTextarea
        name="content"
        placeholder={t("comments.placeholder")}
        disabled={isSubmitting}
        className="w-full"
        inputClassName="min-h-[100px] resize-none focus:ring-primary/20"
      />
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 font-semibold"
        >
          {isSubmitting ? t("comments.submitting") : t("comments.submit")}
        </Button>
      </div>
    </form>
  );
}
