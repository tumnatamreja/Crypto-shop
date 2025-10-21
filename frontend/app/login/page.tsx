'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(username, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="cyber-card max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center neon-glow">
          [ LOGIN ]
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-neon-cyan">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-neon-cyan">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cyber-button w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-neon-cyan">Don't have an account? </span>
          <button
            onClick={() => router.push('/register')}
            className="text-neon-green hover:underline font-bold"
          >
            Register
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-neon-cyan hover:underline"
          >
            Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
}
