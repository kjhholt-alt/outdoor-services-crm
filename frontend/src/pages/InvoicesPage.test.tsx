import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '../test/wrapper'
import { InvoicesPage } from './InvoicesPage'

describe('InvoicesPage', () => {
  it('renders invoices heading', () => {
    render(<InvoicesPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText('Invoices')).toBeInTheDocument()
  })
})
