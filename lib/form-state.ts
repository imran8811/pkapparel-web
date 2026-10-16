/** What every form action returns (shared by server actions and forms, on the site and in the admin). */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field errors from the API, keyed by field name (e.g. "question" or "images.0.alt"). */
  fields?: Record<string, string>;
  /** After a successful save, open this page (e.g. the editor of a post just created). */
  redirectTo?: string;
};

export const idle: FormState = { status: "idle" };
