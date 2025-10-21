'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [telegram, setTelegram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await register(username, password, telegram || undefined);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="cyber-card max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center neon-glow">
          [ REGISTER ]
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-neon-cyan">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input"
              placeholder="Choose username"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-neon-cyan">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
              placeholder="Choose password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block mb-2 text-neon-cyan">
              Telegram (optional)
            </label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="cyber-input"
              placeholder="@username"
            />
            <p className="text-xs text-neon-cyan/60 mt-1">
              Optional - for order notifications
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cyber-button w-full"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-neon-cyan">Already have an account? </span>
          <button
            onClick={() => router.push('/login')}
            className="text-neon-green hover:underline font-bold"
          >
            Login
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
