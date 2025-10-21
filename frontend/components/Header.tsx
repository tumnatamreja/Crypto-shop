'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-neon-red/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-neon-red to-neon-orange rounded-lg flex items-center justify-center font-bold text-white">
              SH
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">SinHuella Corp</h1>
              <p className="text-xs text-gray-400">Anonymous Shopping</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-neon-red transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => router.push('/#products')}
              className="text-gray-300 hover:text-neon-red transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => router.push('/#contact')}
              className="text-gray-300 hover:text-neon-red transition-colors"
            >
              Contact
            </button>

            {user ? (
              <>
                <button
                  onClick={() => router.push('/profile')}
                  className="text-gray-300 hover:text-neon-red transition-colors"
                >
                  Profile
                </button>
                {user.is_admin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-neon-red hover:text-neon-orange transition-colors font-bold"
                  >
                    Admin
                  </button>
                )}
                <button onClick={logout} className="cyber-button py-2 px-4 text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-gray-300 hover:text-neon-red transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="cyber-button py-2 px-4 text-sm"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-neon-red"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-4 border-t border-neon-red/20 pt-4">
            <button
              onClick={() => {
                router.push('/');
                setMenuOpen(false);
              }}
              className="block w-full text-left text-gray-300 hover:text-neon-red transition-colors py-2"
            >
              Home
            </button>
            <button
              onClick={() => {
                router.push('/#products');
                setMenuOpen(false);
              }}
              className="block w-full text-left text-gray-300 hover:text-neon-red transition-colors py-2"
            >
              Products
            </button>
            <button
              onClick={() => {
                router.push('/#contact');
                setMenuOpen(false);
              }}
              className="block w-full text-left text-gray-300 hover:text-neon-red transition-colors py-2"
            >
              Contact
            </button>

            {user ? (
              <>
                <button
                  onClick={() => {
                    router.push('/profile');
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-300 hover:text-neon-red transition-colors py-2"
                >
                  Profile
                </button>
                {user.is_admin && (
                  <button
                    onClick={() => {
                      router.push('/admin');
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left text-neon-red hover:text-neon-orange transition-colors py-2 font-bold"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={logout}
                  className="block w-full text-left cyber-button py-2 px-4 text-sm mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    router.push('/login');
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-300 hover:text-neon-red transition-colors py-2"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    router.push('/register');
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left cyber-button py-2 px-4 text-sm mt-2"
                >
                  Register
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
