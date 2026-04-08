// frontend/src/features/post/hooks/useCreatePost.js
import { useTranslations } from "next-intl";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { NotificationService } from "@/lib/notify";

import { selectPostMutating } from "@/store/slices/post/post-selectors";
import { createPost } from "@/store/slices/post/post-thunks";

/**
 * Hook for creating a new post
 * - Returns onSubmit handler and isSubmitting state
 * - Shows success toast on successful creation
 * - Suppresses duplicate error toasts for global errors
 *
 * @returns {{ onSubmit: Function, isSubmitting: boolean }}
 */
export function useCreatePost() {
  const dispatch = useAppDispatch();
  const t = useTranslations("toasts");
  const isSubmitting = useAppSelector(selectPostMutating);

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    try {
      await dispatch(createPost(data)).unwrap();
      NotificationService.success(t("postsCreateSuccess"));
    } catch (err) {
      if (!err?.isGlobalError) {
        NotificationService.error(err?.message || t("postsCreateFailed"));
      }
    }
  };

  return {
    onSubmit,
    isSubmitting,
  };
}
