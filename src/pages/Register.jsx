import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertTriangle, CheckCircle } from 'lucide-react';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerApi } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    try {
      await registerApi(data.name, data.email, data.password);
      setSuccess(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-100">Verify Your Email</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            We have sent a verification link to your registered email address. Please click the link to complete registration and activate your account.
          </p>
          <div className="pt-4 border-t border-slate-800/60">
            <Link to="/login" className="w-full inline-block py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all border border-indigo-500/35">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-2 text-indigo-400">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gradient">
            CivicConnect
          </h1>
          <p className="text-slate-400 text-sm mt-1">Register to start reporting civic issues</p>
        </div>

        {/* Alerts */}
        {apiError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${errors.name ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-600 text-slate-200`}
                {...register('name', { 
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
              />
            </div>
            {errors.name && (
              <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${errors.email ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-600 text-slate-200`}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            {errors.email && (
              <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${errors.password ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-600 text-slate-200`}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
            </div>
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-600 text-slate-200`}
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 disabled:text-indigo-400 border border-indigo-500/35 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
