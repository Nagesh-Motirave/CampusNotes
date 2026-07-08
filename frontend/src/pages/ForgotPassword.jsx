import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { forgotPassword } from '../api/auth';

/**
 * Forgot Password Page — allows user to request a password reset link via email.
 * Shows a success state on submission, or a graceful fallback if the backend
 * endpoint does not exist yet.
 */
const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        toast.error('Password reset feature is coming soon.');
      } else {
        const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Reset your password</h1>
          <p className="text-gray-500 mt-1">We'll send you a link to reset it</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                If an account exists for that email, we've sent a password reset link. Please check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                id="back-to-login"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiMail className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="you@college.edu"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
                id="forgot-password-submit"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to login link */}
        {!submitted && (
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link
              to="/login"
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors inline-flex items-center gap-1"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
