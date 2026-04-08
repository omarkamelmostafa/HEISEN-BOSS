// frontend/src/features/auth/components/forms/form-textarea.jsx

"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";

/**
 * Reusable form textarea field used for multi-line inputs.
 * Minimal RHF-connected version following form-field.jsx pattern.
 */
const FormTextarea = React.forwardRef(
  (
    {
      label,
      name,
      placeholder,
      disabled = false,
      required = false,
      className = "",
      inputClassName = "",
      ...props
    },
    ref
  ) => {
    const {
      register,
      formState: { errors, touchedFields },
    } = useFormContext();

    const error = errors?.[name];
    const isTouched = touchedFields?.[name];
    const errorMessage = error?.message || (isTouched && error ? String(error) : null);

    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium gap-0">
            {label}
            {required && <span aria-hidden="true">*</span>}
          </Label>
        )}

        <Textarea
          ref={ref}
          id={name}
          {...register(name)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full
            ${
              errorMessage
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : ""
            }
            transition-colors duration-200
            ${inputClassName}
          `}
          {...props}
        />

        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 font-medium"
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
