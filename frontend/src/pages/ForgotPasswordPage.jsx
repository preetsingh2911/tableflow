import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-bold gradient-text">TableFlow</span>
          </Link>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-surface-400 mb-6">
                If an account exists for <strong className="text-white">{email}</strong>, 
                we've sent password reset instructions.
              </p>
              <Link to="/login" className="btn-primary">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-surface-400 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  placeholder="you@restaurant.com"
                  required
                  autoFocus
                />
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <div className="spinner mx-auto" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-surface-400 mt-6 text-sm">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
