/**
 * Minimal pure domain. This is the center of the hexagon: no I/O, no framework,
 * no environment — a value in, a value out. Replace it with your own model and
 * let a use-case (application/) pull more domain into existence (TDD, outside-in).
 */
export interface Greeting {
  readonly recipient: string
  readonly message: string
}

/** Pure: a name in, a greeting out. Trims, and rejects an empty name. */
export function buildGreeting(name: string): Greeting {
  const recipient = name.trim()
  if (recipient === '') {
    throw new Error('name must not be empty')
  }
  return { recipient, message: `Hello, ${recipient}!` }
}
