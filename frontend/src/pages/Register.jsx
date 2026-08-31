import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiKey, FiArrowLeft } from 'react-icons/fi';
import CollegeAutocomplete from '../components/CollegeAutocomplete';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../api/auth';

/**
 * Register Page — 2-step email-verified registration:
 * Step 1: User enters name, email, college, password. Backend validates and emails 6-digit OTP.
 * Step 2: User enters the 6-digit OTP received via email to complete account creation.
 */
const Register = () => {
  const { setAuthSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
    reset: resetOtpForm,
  } = useForm();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0 && step === 2) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  /** Step 1: Submit user details and send email OTP */
  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await sendRegistrationOtp(registerData);
      setPendingFormData(registerData);
      setStep(2);
      setCountdown(60);
      resetOtpForm();
      toast.success('Verification code sent to your email! 📧');
    } catch (err) {
      let msg;
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Server is taking too long to respond. Please try again in a moment.';
      } else if (!err.response) {
        msg = 'Unable to reach the server. Please check your connection and try again.';
      } else {
        msg = 'Failed to send verification code. Please try again.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Verify OTP and complete account creation */
  const onOtpVerification = async (data) => {
    if (!pendingFormData?.email) {
      toast.error('Session expired. Please enter your details again.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const authResponse = await verifyRegistrationOtp({
        email: pendingFormData.email,
        otp: data.otp.trim(),
      });
      setAuthSession(authResponse);
      toast.success('Account created! Welcome to Campus Notes Hub! 🎓');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /** Resend OTP */
  const onResendOtp = async () => {
    if (countdown > 0 || !pendingFormData) return;
    setLoading(true);
    try {
      await sendRegistrationOtp(pendingFormData);
      setCountdown(60);
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              {step === 2 ? (
                <FiKey className="w-6 h-6 text-white" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 1 ? (
              'Join thousands of students sharing notes'
            ) : (
              <>
                Enter the 6-digit code sent to{' '}
                <strong className="text-gray-700">{pendingFormData?.email}</strong>
              </>
            )}
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card p-8">
          {step === 1 ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiUser className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    className={`input-field pl-10 ${errors.name ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Your full name"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiMail className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="register-email"
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
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* College — Searchable Autocomplete */}
              <div>
                <label htmlFor="register-college" className="block text-sm font-medium text-gray-700 mb-1.5">
                  College name
                </label>
                <CollegeAutocomplete
                  inputId="register-college"
                  value={watch('college') || ''}
                  placeholder="e.g. VJTI Mumbai"
                  error={!!errors.college}
                  onChange={({ name, id }) => {
                    setValue('college', name, { shouldValidate: true });
                    setSelectedCollegeId(id);
                  }}
                />
                {/* Hidden field for React Hook Form validation */}
                <input
                  type="hidden"
                  {...register('college', {
                    required: 'College name is required',
                  })}
                />
                {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiLock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Min 6 characters"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    id="register-toggle-password"
                  >
                    {showPassword ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiLock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="register-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input-field pl-10 pr-11 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="Repeat your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    id="register-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2"
                id="register-submit"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending verification code...
                  </div>
                ) : (
                  'Continue with Email Verification'
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleOtpSubmit(onOtpVerification)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  className={`input-field text-center text-2xl tracking-widest font-mono font-bold ${
                    otpErrors.otp ? 'border-red-400 focus:ring-red-500' : ''
                  }`}
                  placeholder="------"
                  {...registerOtp('otp', {
                    required: 'Verification code is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Verification code must be exactly 6 digits',
                    },
                  })}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpValue('otp', val, { shouldValidate: true });
                  }}
                />
                {otpErrors.otp && (
                  <p className="text-red-500 text-xs mt-1 text-center">{otpErrors.otp.message}</p>
                )}
                <p className="text-xs text-gray-500 text-center mt-2">
                  Code expires in 5 minutes
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
                id="register-verify-submit"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              {/* Resend and Edit options */}
              <div className="flex flex-col items-center gap-3 pt-2 text-sm">
                <div>
                  <span className="text-gray-500">Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={countdown > 0 || loading}
                    className={`font-semibold ${
                      countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  Edit registration details
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
