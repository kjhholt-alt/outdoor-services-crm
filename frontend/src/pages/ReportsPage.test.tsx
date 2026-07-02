import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '../test/wrapper'
import { ReportsPage } from './ReportsPage'

describe('ReportsPage', () => {
  it('renders heading after data loads', async () => {
    render(<ReportsPage />, { wrapper: createTestWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
