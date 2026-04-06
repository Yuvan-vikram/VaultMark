'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, Lock } from 'lucide-react'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push(from)
        router.refresh()
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)' }}
          >
            <Bookmark size={22} color="#0f0f0e" />
          </div>
          <h1 className="text-xl font-semibold">VaultMark</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-9"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#f43f5e' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium mt-1"
            style={{
              background: loading ? 'var(--surface2)' : 'var(--accent)',
              color: loading ? 'var(--text3)' : '#0f0f0e',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Checking...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
