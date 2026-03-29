/**
 * @deprecated Validation is now handled by Zod in index.ts.
 * These exports are kept for backward compatibility only.
 */
export function validateStartupSecrets(): void {
  // no-op — Zod schema in index.ts handles all validation and exits on failure
}

export function logSecretsStatus(): void {
  // no-op
}
