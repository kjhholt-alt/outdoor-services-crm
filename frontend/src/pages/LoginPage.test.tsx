import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '../test/wrapper'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('renders login form with fields and submit button', () => {
    render(<LoginPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders AATOS branding', () => {
    render(<LoginPage />, { wrapper: createTestWrapper() })
    expect(screen.getByText('AATOS CRM')).toBeInTheDocument()
  })
})
