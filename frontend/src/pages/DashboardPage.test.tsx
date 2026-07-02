import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '../test/wrapper'
import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    render(<DashboardPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })
})
