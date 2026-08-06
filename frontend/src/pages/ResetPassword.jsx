import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { resetPassword } from '../api/auth';

/**
 * Reset Password Page — allows user to set a new password using a token from their email.
 */
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing password reset token.');
      navigate('/login');
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (!token) return;
    setLoading(true);
    try {
      await resetPassword({ token, newPassword: data.newPassword });
      setSubmitted(true);
      toast.success('Password has been successfully reset!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null; // redirecting in useEffect

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FiLock className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Set new password</h1>
          <p className="text-gray-500 mt-1">Please enter your new password below</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Successfully</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                You can now log in with your new password.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiLock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className={`input-field pl-10 ${errors.newPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Enter new password"
                    {...register('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiLock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Confirm new password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (val) => {
                        if (watch('newPassword') != val) {
                          return 'Passwords do no match';
                        }
                      },
                    })}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

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

export default ResetPassword;
