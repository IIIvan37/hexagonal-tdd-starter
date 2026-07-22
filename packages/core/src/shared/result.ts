// KEEP — generic skeleton, not part of the greet example. Every slice reuses this.
/**
 * The domain's way of saying "this can fail, and here is how".
 *
 * Expected failures are values, not exceptions: an empty name is a legitimate
 * outcome of parsing untrusted input, not an emergency. Keeping it in the type
 * means a caller cannot forget to handle it, and `try/catch` stays reserved for
 * what it is actually for — the unexpected.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

/** Wrap a success. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/** Wrap a failure. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

/** Type guard: narrows to the success branch. */
export function isOk<T, E>(
  result: Result<T, E>
): result is { readonly ok: true; readonly value: T } {
  return result.ok
}

/** Type guard: narrows to the failure branch. */
export function isErr<T, E>(
  result: Result<T, E>
): result is { readonly ok: false; readonly error: E } {
  return !result.ok
}
