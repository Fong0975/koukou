"use client";

import { useState } from "react";
import type { ZodType } from "zod";
import { type FieldErrors, toFieldErrors } from "@/lib/form/fieldErrors";
import { useAsyncAction } from "./useAsyncAction";

/**
 * Submits a form after checking its values with the zod schema the API uses, so most mistakes show on the
 * inputs before anything is sent. Field errors the server still reports are merged in, under the client's own.
 *
 * @param schema - The schema the values must pass.
 * @param submit - Sends the values; a rejection becomes `error`, and an ApiClientError's details become field errors.
 * @returns The field errors, the server's own field errors, the save state and `submit`.
 */
export function useValidatedSubmit<I>(schema: ZodType, submit: (input: I) => Promise<void>) {
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const action = useAsyncAction(submit);

  const validateAndSubmit = async (input: I) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      setClientErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setClientErrors({});
    await action.run(input);
  };

  const serverErrors = toFieldErrors(action.apiError?.details ?? []);

  return {
    fieldErrors: { ...serverErrors, ...clientErrors },
    serverErrors,
    pending: action.pending,
    error: action.error,
    submit: validateAndSubmit,
  };
}
