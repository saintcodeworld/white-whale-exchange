'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: { id: number; username: string; balance: number }) => void;
  pendingReward?: number;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(10px)',
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(2,11,28,0.97), rgba(10,42,74,0.95))',
  border: '1px solid rgba(0,247,255,0.25)',
  borderRadius: 20,
  padding: 32,
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 0 60px rgba(0,247,255,0.12), 0 20px 60px rgba(0,0,0,0.5)',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,10,30,0.7)',
  border: '1px solid rgba(0,247,255,0.2)',
  borderRadius: 12,
  padding: '14px 16px',
  fontFamily: "'Fredoka', sans-serif",
  fontSize: 15,
  color: '#e8f4ff',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s, box-shadow 0.3s',
};

const submitStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  border: 'none',
  borderRadius: 14,
  fontFamily: "'Luckiest Guy', cursive",
  fontSize: 17,
  letterSpacing: 2,
  color: '#1a1100',
  cursor: 'pointer',
  background: 'linear-gradient(180deg, #ffe066 0%, #ffb800 40%, #e6a000 100%)',
  boxShadow: '0 0 25px rgba(255,184,0,0.35), 0 4px 15px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
  marginTop: 4,
};

// Mock user storage - fully client-side
function getMockUsers(): Record<string, { id: number; username: string; password: string; balance: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('mockUsers');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveMockUsers(users: Record<string, { id: number; username: string; password: string; balance: number }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mockUsers', JSON.stringify(users));
}

export default function AuthModal({ isOpen, onClose, onAuthenticated, pendingReward }: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const users = getMockUsers();

      if (mode === 'signup') {
        // Check if username exists
        if (users[username]) {
          setError('Username already exists');
          setLoading(false);
          return;
        }

        // Create new user
        const newId = Date.now();
        const newUser = {
          id: newId,
          username,
          password,
          balance: pendingReward || 0,
        };

        users[username] = newUser;
        saveMockUsers(users);

        // Save session
        localStorage.setItem('mockUser', JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          balance: newUser.balance,
        }));

        onAuthenticated({
          id: newUser.id,
          username: newUser.username,
          balance: newUser.balance,
        });
      } else {
        // Login
        const user = users[username];
        if (!user || user.password !== password) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }

        // Add pending reward if any
        const finalBalance = user.balance + (pendingReward || 0);
        if (pendingReward) {
          users[username].balance = finalBalance;
          saveMockUsers(users);
        }

        // Save session
        localStorage.setItem('mockUser', JSON.stringify({
          id: user.id,
          username: user.username,
          balance: finalBalance,
        }));

        onAuthenticated({
          id: user.id,
          username: user.username,
          balance: finalBalance,
        });
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={overlayStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={modalStyle}
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {pendingReward && (
              <div style={{
                textAlign: 'center',
                padding: 16,
                marginBottom: 20,
                borderRadius: 14,
                background: 'rgba(0,247,255,0.06)',
                border: '1px solid rgba(0,247,255,0.18)',
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 16,
                color: 'rgba(232,244,255,0.85)',
              }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🎉</span>
                You won <span style={{ color: '#00f7ff', fontWeight: 700 }}>{pendingReward.toLocaleString()} $WHITEWHALE</span>!
                <br />
                <span style={{ fontSize: 13, color: 'rgba(232,244,255,0.5)' }}>
                  {mode === 'signup' ? 'Sign up to claim your tokens' : 'Log in to claim your tokens'}
                </span>
              </div>
            )}

            <h2 style={{
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: 26,
              color: '#00f7ff',
              textAlign: 'center',
              marginBottom: 24,
              letterSpacing: 1,
              textShadow: '0 0 20px rgba(0,247,255,0.3)',
            }}>
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 13,
                  color: 'rgba(232,244,255,0.6)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  placeholder="Choose a username"
                  minLength={3}
                  maxLength={20}
                  required
                  autoFocus
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,247,255,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 13,
                  color: 'rgba(232,244,255,0.6)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,247,255,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {error && (
                <div style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 13,
                  color: '#ff4d6a',
                  textAlign: 'center',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,77,106,0.1)',
                  border: '1px solid rgba(255,77,106,0.2)',
                }}>{error}</div>
              )}

              <button
                type="submit"
                style={{ ...submitStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                disabled={loading}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                {loading ? 'Please wait...' : mode === 'signup' ? 'SIGN UP' : 'LOG IN'}
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: 18,
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 13,
              color: 'rgba(232,244,255,0.5)',
            }}>
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00f7ff',
                      cursor: 'pointer',
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: 13,
                      textDecoration: 'underline',
                    }}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00f7ff',
                      cursor: 'pointer',
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: 13,
                      textDecoration: 'underline',
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
