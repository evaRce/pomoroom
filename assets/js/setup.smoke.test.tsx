import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

function Greeting() {
  return <p>Hola, Vitest</p>
}

describe('test pipeline setup', () => {
  it('renders a React component with React Testing Library', () => {
    render(<Greeting />)
    expect(screen.getByText('Hola, Vitest')).toBeInTheDocument()
  })

  it('has no accessibility violations (jest-axe)', async () => {
    const { container } = render(<Greeting />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
