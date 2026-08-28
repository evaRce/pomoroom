import '@testing-library/jest-dom/vitest'
import { afterEach, expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'
import { cleanup } from '@testing-library/react'

expect.extend(toHaveNoViolations)

// jsdom doesn't implement matchMedia, but antd's grid/responsive components need it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

afterEach(() => {
  cleanup()
})
