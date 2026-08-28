import '@testing-library/jest-dom/vitest'
import { afterEach, expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'
import { cleanup } from '@testing-library/react'

expect.extend(toHaveNoViolations)

afterEach(() => {
  cleanup()
})
