import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiCheckCircle, FiLock, FiKey } from 'react-icons/fi';
import { forgotPassword, verifyOtp, resetPassword } from '../api/auth';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm();

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm();

  useEffect(() => {
    let timer;
    if (countdown > 0 && step === 2) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  const onEmailSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
      setCountdown(60);
      toast.success('OTP sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setCountdown(60);
      toast.success('A new OTP has been sent.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data) => {
    setLoading(true);
    try {
      await verifyOtp({ email, otp: data.otp });
      setOtp(data.otp);
      setStep(3);
      toast.success('OTP verified!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword: data.newPassword });
      setStep(4);
      toast.success('Password updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              {step === 2 || step === 3 ? (
                <FiKey className="w-6 h-6 text-white" />
              ) : step === 4 ? (
                <FiCheckCircle className="w-6 h-6 text-white" />
              ) : (
                <FiMail className="w-6 h-6 text-white" />
              )}
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {step === 1 && 'Reset your password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Set new password'}
            {step === 4 && 'All set!'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 1 && "We'll send a code to your email"}
            {step === 2 && `Enter the 6-digit code sent to ${email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))}`}
            {step === 3 && 'Create a strong, new password'}
            {step === 4 && 'Your password has been updated.'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {step === 1 && (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiMail className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`input-field pl-10 ${emailErrors.email ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="you@college.edu"
                    {...registerEmail('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{emailErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className={`input-field text-center text-2xl tracking-widest ${otpErrors.otp ? 'border-red-400 focus:ring-red-500' : ''}`}
                  placeholder="------"
                  {...registerOtp('otp', {
                    required: 'OTP is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'OTP must be exactly 6 digits',
                    },
                  })}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpValue('otp', val);
                  }}
                />
                {otpErrors.otp && (
                  <p className="text-red-500 text-xs mt-1 text-center">{otpErrors.otp.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center text-sm">
                <span className="text-gray-500">Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={countdown > 0 || loading}
                  className={`font-semibold ${countdown > 0 ? 'text-gray-400' : 'text-primary-600 hover:text-primary-700'}`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
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
                    className={`input-field pl-10 ${passwordErrors.newPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Enter new password"
                    {...registerPassword('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/,
                        message: 'Must contain uppercase, lowercase, number, and special character',
                      },
                    })}
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>
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
                    className={`input-field pl-10 ${passwordErrors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Confirm new password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (val) => {
                        if (watchPassword('newPassword') != val) {
                          return 'Passwords do no match';
                        }
                      },
                    })}
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <Link
                to="/login"
                className="btn-primary w-full py-3 block"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>

        {/* Back to login link */}
        {step < 4 && (
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
