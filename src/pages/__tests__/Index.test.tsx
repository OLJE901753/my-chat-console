import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { describe, it, expect } from 'vitest'

import Index from '@/pages/Index'

describe('Index page', () => {
  it('renders without crashing', () => {
    render(
      <Suspense fallback={null}>
        <Index />
      </Suspense>
    )
    expect(screen.getByText(/Dashboard/i)).toBeTruthy()
  })
})
