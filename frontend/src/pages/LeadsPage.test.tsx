import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '../test/wrapper'
import { LeadsPage } from './LeadsPage'

describe('LeadsPage', () => {
  it('renders market leads heading', () => {
    render(<LeadsPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText('Market Leads')).toBeInTheDocument()
  })

  it('renders lead cards', () => {
    render(<LeadsPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText(/Holiday Inn Express/)).toBeInTheDocument()
  })
})
