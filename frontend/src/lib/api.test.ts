import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { api, ApiError, errorMessage, request, resetCsrf } from './api'
const csrf = { token: 'test-token', headerName: 'X-REAL-CSRF', parameterName: '_csrf' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
beforeEach(resetCsrf)
afterEach(() => vi.unstubAllGlobals())
describe('session HTTP client', () => {
  it('uses the server-provided CSRF header and includes session cookies', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(csrf))
      .mockResolvedValueOnce(json({ ok: true }))
    vi.stubGlobal('fetch', fetch)
    await request('/example', z.object({ ok: z.boolean() }), { method: 'POST', body: '{}' })
    const options = fetch.mock.calls[1][1] as RequestInit
    expect(new Headers(options.headers).get('X-REAL-CSRF')).toBe('test-token')
    expect(options.credentials).toBe('include')
  })
  it('does not retry order mutations after a stock conflict', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(csrf))
      .mockResolvedValueOnce(json({ status: 409, detail: 'stock' }, 409))
    vi.stubGlobal('fetch', fetch)
    await expect(api.createOrder([{ productId: 'a', quantity: 1 }])).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('signals an expired identity on HTTP401', async () => {
    const listener = vi.fn()
    window.addEventListener('ordersphere:unauthorized', listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status: 401 }, 401)))
    await expect(api.me()).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('ordersphere:unauthorized', listener)
  })
  it('handles non-JSON failures without exposing the response HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<h1>proxy internal data</h1>', { status: 502 })),
    )
    try {
      await api.me()
      throw new Error('Expected rejection')
    } catch (error) {
      expect(errorMessage(error)).not.toContain('proxy internal data')
      expect(errorMessage(error)).toContain('indisponível')
    }
  })
  it('rotates CSRF after login and accepts no-content logout', async () => {
    const user = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'a@example.test',
      role: 'CUSTOMER',
    }
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(csrf))
      .mockResolvedValueOnce(json(user))
      .mockResolvedValueOnce(json({ ...csrf, token: 'rotated' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    await api.login({ email: user.email, password: 'not-real-test-password' })
    await api.logout()
    const options = fetch.mock.calls[3][1] as RequestInit
    expect(new Headers(options.headers).get(csrf.headerName)).toBe('rotated')
  })
})
