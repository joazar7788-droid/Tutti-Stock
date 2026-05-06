export const READ_ONLY_ERROR_MESSAGE =
  "This website no longer accepts entries. Go to Tuttifruttimanagement.com.";

export function readOnlyError(): { error: string } {
  return { error: READ_ONLY_ERROR_MESSAGE };
}
