#!/usr/bin/env node
import { run } from './run.ts'

// Entrypoint: the process boundary, and nothing else. Everything testable lives
// in `run.ts` — see `run.spec.ts` (in process) and `main.spec.ts` (real binary).
process.exit(await run(process.argv.slice(2)))
