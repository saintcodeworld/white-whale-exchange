'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (newBalance: number) => void;
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

const titleStyle: React.CSSProperties = {
  fontFamily: "'Luckiest Guy', cursive",
  fontSize: 26,
  color: '#00f7ff',
  textAlign: 'center',
  marginBottom: 20,
  letterSpacing: 1,
  textShadow: '0 0 20px rgba(0,247,255,0.3)',
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

const labelStyle: React.CSSProperties = {
  fontFamily: "'Fredoka', sans-serif",
  fontSize: 13,
  color: 'rgba(232,244,255,0.6)',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
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

export default function WithdrawModal({ isOpen, onClose, balance, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount');
      setLoading(false);
      return;
    }

    if (numAmount > balance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, walletAddress }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Withdrawal failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      onWithdraw(data.balance);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setWalletAddress('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.5)';
    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,247,255,0.1)';
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,247,255,0.2)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={overlayStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            style={modalStyle}
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 56 }}>✅</div>
                <h2 style={titleStyle}>Withdrawal Submitted</h2>
                <p style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 14,
                  color: 'rgba(232,244,255,0.6)',
                  lineHeight: 1.7,
                  maxWidth: 300,
                }}>
                  Your withdrawal of <strong style={{ color: '#00f7ff' }}>{parseFloat(amount).toLocaleString()} $WHITEWHALE</strong> has been submitted.
                  Tokens will be sent to your wallet shortly.
                </p>
                <button
                  onClick={handleClose}
                  style={submitStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <>
                <h2 style={titleStyle}>Withdraw Tokens</h2>

                {/* Balance display */}
                <div style={{
                  textAlign: 'center',
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 14,
                  color: 'rgba(232,244,255,0.6)',
                  marginBottom: 24,
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(0,247,255,0.05)',
                  border: '1px solid rgba(0,247,255,0.12)',
                }}>
                  Available:{' '}
                  <span style={{ color: '#00f7ff', fontWeight: 700, fontSize: 20, fontFamily: "'Luckiest Guy', cursive", letterSpacing: 1 }}>
                    {balance.toLocaleString()}
                  </span>{' '}
                  $WHITEWHALE
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Amount field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Amount</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 70 }}
                        placeholder="0"
                        min="1"
                        max={balance}
                        step="1"
                        required
                        onFocus={focusHandler}
                        onBlur={blurHandler}
                      />
                      <button
                        type="button"
                        onClick={() => setAmount(String(Math.floor(balance)))}
                        style={{
                          position: 'absolute',
                          right: 10,
                          background: 'rgba(0,247,255,0.15)',
                          border: '1px solid rgba(0,247,255,0.35)',
                          borderRadius: 8,
                          padding: '5px 12px',
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#00f7ff',
                          cursor: 'pointer',
                          letterSpacing: 1,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,247,255,0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,247,255,0.15)'; }}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Wallet address field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Solana Wallet Address</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      style={inputStyle}
                      placeholder="Enter your Solana wallet address"
                      required
                      onFocus={focusHandler}
                      onBlur={blurHandler}
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
                    {loading ? 'Processing...' : 'WITHDRAW'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
