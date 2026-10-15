import { verifyContent } from '../src/engine/verifyContent'

const errs = verifyContent()
if (errs.length) {
  console.error(`Content verification FAILED (${errs.length}):\n- ${errs.join('\n- ')}`)
  process.exit(1)
}
console.log('Content verification passed: all cases are consistent and solvable.')
