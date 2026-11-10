import React, { useState } from 'react';
import { adminLogin } from '../api/client';
import { Lock, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminLogin({ password });
      if (res.token) {
        localStorage.setItem('admin_token', res.token);
        onLoginSuccess();
      } else {
        setError('Invalid login response');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-[#1F3BB3] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Portfolio
          </button>
          
          <div className="mx-auto w-16 h-16 bg-[#1F3BB3]/10 border border-[#1F3BB3]/20 rounded-2xl flex items-center justify-center text-[#1F3BB3] mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your secure master password to access the Star Admin control panel.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F3BB3]/30 focus:border-[#1F3BB3] transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold text-white bg-[#1F3BB3] hover:bg-[#183096] focus:outline-none focus:ring-2 focus:ring-[#1F3BB3] focus:ring-offset-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Control Panel'
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400">
          Star Admin 2 • Secure Portfolio Management
        </div>
      </div>
    </div>
  );
};
