import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, Eye, EyeOff, Check, Camera, Lock, Mail, User, ShieldAlert, RefreshCcw, CheckCircle2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoginBackground from "./LoginBackground";

interface AuthProps {
  onLogin: (e: React.FormEvent, name: string) => Promise<void>;
  email: string;
  setEmail: (e: string) => void;
  pass: string;
  setPass: (e: string) => void;
  onResetPassword: (email: string, newPass: string, otp: string) => Promise<void>;
  onSendOTP: (email: string) => Promise<void>;
  onVerifyOTP: (email: string, otp: string) => Promise<boolean>;
}

export default function AuthContainer({ onLogin, email, setEmail, pass, setPass, onResetPassword, onSendOTP, onVerifyOTP }: AuthProps) {
  const [loginView, setLoginView] = useState<'login' | 'forgot' | 'otp' | 'captcha' | 'reset' | 'success'>('login');
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [otp, setOtp] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CAPTCHA simulation
  const [captchaVal, setCaptchaVal] = useState({ text: "", code: "" });
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaVal({ text: "Security Verification", code });
  };

  useEffect(() => {
    if (loginView === 'captcha') {
      generateCaptcha();
      setCaptchaInput("");
    }
  }, [loginView]);

  useEffect(() => {
    if (secondsRemaining > 0) {
      const timer = setInterval(() => setSecondsRemaining(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [secondsRemaining]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Password validation: Min 8 chars, 1 upper, 1 lower, 1 number, 1 special
  const validatePassword = (p: string) => {
    const checks = {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(p)
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score, isValid: score === 5 };
  };

  const loginPassStatus = useMemo(() => validatePassword(pass), [pass]);
  const resetPassStatus = useMemo(() => validatePassword(newPass), [newPass]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassStatus.isValid || !termsAccepted || !fullName || !email) return;
    setLoading(true);
    setError(null);
    try {
      await onLogin(e, fullName);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSendOTP(email);
      setLoginView('otp');
      setSecondsRemaining(300);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isValid = await onVerifyOTP(email, otp);
      if (isValid) {
        setLoginView('captcha');
      } else {
        setError("Verification code is incorrect or has expired.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassStatus.isValid || newPass !== confirmPass) return;
    setLoading(true);
    setError(null);
    try {
      await onResetPassword(email, newPass, otp);
      setLoginView('success');
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordStrength = ({ status }: { status: any }) => (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= status.score 
                ? status.score === 5 ? 'bg-green-500' : 'bg-blue-400' 
                : 'bg-gray-100'
            }`} 
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-400 font-medium tracking-tight">
        <div className={`flex items-center gap-1 ${status.checks.length ? 'text-green-600' : ''}`}>
          {status.checks.length ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 border border-gray-200 rounded-full" />} 8+ Characters
        </div>
        <div className={`flex items-center gap-1 ${status.checks.upper ? 'text-green-600' : ''}`}>
          {status.checks.upper ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 border border-gray-200 rounded-full" />} Uppercase
        </div>
        <div className={`flex items-center gap-1 ${status.checks.lower ? 'text-green-600' : ''}`}>
          {status.checks.lower ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 border border-gray-200 rounded-full" />} Lowercase
        </div>
        <div className={`flex items-center gap-1 ${status.checks.number ? 'text-green-600' : ''}`}>
          {status.checks.number ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 border border-gray-200 rounded-full" />} Number
        </div>
        <div className={`flex items-center gap-1 ${status.checks.special ? 'text-green-600' : ''}`}>
          {status.checks.special ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 border border-gray-200 rounded-full" />} Special (!@#)
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="relative flex-1 flex flex-col justify-between p-4 md:p-6 min-h-screen transition-all duration-700 select-none overflow-y-auto"
    >
      <LoginBackground />

      {/* Main perfectly centered glass login container with absolute size consistency */}
      <div className="flex-1 flex items-center justify-center py-6">
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/88 backdrop-blur-xl w-full max-w-[400px] min-h-[530px] p-6 sm:p-7 rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.18),0_0_40px_rgba(255,255,255,0.75)_inset,0_2px_4px_rgba(0,0,0,0.02)] border border-white/70 text-slate-800 z-10 my-auto flex flex-col justify-between"
        >
          <div className="text-center space-y-1 mb-2 shrink-0">
            <div className="flex justify-center mb-1.5">
              <div className="relative w-14 h-14 bg-slate-900 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center group overflow-hidden">
                <span className="text-orange-500 text-3xl font-black tracking-tight">
                  G
                </span>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              {loginView === 'login' && "Sign In"}
              {loginView === 'forgot' && "Reset Password"}
              {loginView === 'otp' && "Verification"}
              {loginView === 'captcha' && "Security Check"}
              {loginView === 'reset' && "Update Password"}
              {loginView === 'success' && "Success"}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold leading-normal">
              {loginView === 'login' && "Enter your credentials to access your account."}
              {loginView === 'forgot' && "We'll send a code to your registered email."}
              {loginView === 'otp' && "Please enter the 6-digit code sent to your email."}
              {loginView === 'captcha' && "Please verify that you are human."}
              {loginView === 'reset' && "Create a new strong password for your account."}
              {loginView === 'success' && "Your password has been reset successfully."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {loginView === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleLoginSubmit} 
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full border border-slate-200/85 bg-white/95 rounded-xl py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full border border-slate-200/85 bg-white/95 rounded-xl py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        Password
                      </label>
                      <button type="button" onClick={() => setLoginView('forgot')} className="text-[11px] text-blue-600 hover:underline font-bold">Forgot?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200/85 bg-white/95 rounded-xl py-2.5 pl-10 pr-10 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-900 shadow-xs"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength status={loginPassStatus} />
                  </div>

                  <div className="flex items-start gap-2.5 mt-3">
                    <button 
                      type="button" 
                      disabled={!loginPassStatus.isValid}
                      onClick={() => setTermsAccepted(!termsAccepted)}
                      className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                        termsAccepted ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/20' : 'border-slate-300 bg-white'
                      } disabled:opacity-30 cursor-pointer`}
                    >
                      {termsAccepted && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>
                    <div className={`text-[10px] leading-snug select-none ${loginPassStatus.isValid ? 'text-slate-600 font-semibold' : 'text-slate-400 font-semibold'}`}>
                      I agree to the <span className="text-orange-500 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-orange-500 hover:underline cursor-pointer">Privacy Policy</span>.
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!loginPassStatus.isValid || !termsAccepted || !fullName || !email || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-3 rounded-xl text-xs transition-all tracking-wide shadow-md shadow-orange-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </motion.form>
            )}

            {loginView === 'forgot' && (
              <motion.div 
                key="forgot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-slate-200 bg-white/95 rounded-xl py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-900 shadow-xs"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                  <button onClick={() => setLoginView('login')} className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-wider text-center hover:text-slate-950 transition-colors cursor-pointer">Back to Login</button>
                </div>
              </motion.div>
            )}

            {loginView === 'otp' && (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="grid grid-cols-6 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        className="w-full aspect-square border border-slate-200 bg-white/95 rounded-xl text-center text-lg font-bold focus:border-orange-500 outline-none transition-all shadow-xs text-slate-900 animate-fade-in"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (!val) return;
                          e.target.value = val;
                          if (i < 5) (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
                          setOtp(prev => {
                            const arr = (prev.padEnd(6, ' ')).split('');
                            arr[i] = val;
                            return arr.join('').trim();
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) {
                            (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          const paste = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
                          if (paste.length === 6) {
                            setOtp(paste);
                            paste.split('').forEach((char, index) => {
                              const el = document.getElementById(`otp-${index}`) as HTMLInputElement;
                              if (el) el.value = char;
                            });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length < 6}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                  <div className="text-[11px] text-center text-slate-400 font-medium pb-2">
                    {secondsRemaining > 0 ? (
                      `Resend code in ${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, '0')}`
                    ) : (
                      <span onClick={handleSendOTP} className="text-orange-500 cursor-pointer hover:underline font-bold">Resend Code</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {loginView === 'captcha' && (
              <motion.div 
                key="captcha"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-3 shadow-inner">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{captchaVal.text}</div>
                    <div className="text-2xl font-bold text-slate-800 tracking-widest select-none bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-4">
                      {captchaVal.code}
                      <button onClick={generateCaptcha} className="text-slate-300 hover:text-orange-500 transition-colors cursor-pointer">
                        <RefreshCcw size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter code above"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      className="w-full border border-slate-200 bg-white rounded-xl py-2 px-3 focus:border-orange-500 outline-none font-bold text-center text-xs text-slate-900 shadow-sm"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (captchaInput === captchaVal.code) setLoginView('reset');
                    else {
                      setError("Security code incorrect. Please try again.");
                      generateCaptcha();
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs cursor-pointer mb-2"
                >
                  Verify Identity
                </button>
              </motion.div>
            )}

            {loginView === 'reset' && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleResetSubmit}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="flex-1 flex flex-col justify-center space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="New password"
                        className="w-full border border-slate-200/85 bg-white/95 rounded-xl py-2.5 pl-10 pr-10 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-900 shadow-xs"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors">
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength status={resetPassStatus} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="password"
                        required
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Confirm password"
                        className={`w-full border rounded-xl py-2.5 pl-10 pr-4 outline-none font-semibold text-xs transition-all ${
                          confirmPass && confirmPass !== newPass ? 'border-red-400 bg-red-50 text-red-900' : 'border-slate-200/85 bg-white/95 text-slate-900'
                        }`}
                      />
                    </div>
                    {confirmPass && confirmPass !== newPass && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 mt-1 ml-1"><ShieldAlert size={12} /> Passwords do not match</p>
                    )}
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!resetPassStatus.isValid || newPass !== confirmPass || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer mb-2 flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                  {loading ? "Updating..." : "Set New Password"}
                </button>
              </motion.form>
            )}

            {loginView === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2 flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="flex-1 flex flex-col justify-center space-y-4 my-auto">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-sm animate-bounce">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Password reset successful</p>
                </div>
                <button 
                  onClick={() => {
                    setLoginView('login');
                    setPass("");
                    setNewPass("");
                    setConfirmPass("");
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs cursor-pointer mb-2"
                >
                  Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600 shadow-sm"
            >
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">Error</div>
                <div className="text-[11px] font-bold leading-snug">{error}</div>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-500 cursor-pointer">
                <Check size={14} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer - Perfectly centered to match the screenshot background */}
      <div className="w-full flex flex-col items-center justify-center gap-1 mt-auto pt-4 pb-2 z-20 text-center select-none text-xs text-slate-700 font-bold tracking-tight">
        <div className="flex items-center justify-center gap-3 font-semibold text-slate-800">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="text-slate-400">•</span>
          <span className="hover:underline cursor-pointer">Terms of Use</span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Googly Security Office &copy; 2026
        </div>
      </div>
    </div>
  );
}
