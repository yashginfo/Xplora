// SIGNUP — Mobile Responsive
// Mobile: single column, compact header strip + full-width glass form
// Desktop (lg+): left image panel + right golden glass form panel

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import client from "../api/client";
import useAuth from "../context/useAuth";
import { useTravelBackground } from "../hooks/useTravelBackground";

// ── InputField ─────────────────────────────────────────────────────────────────
const InputField = ({
  label, name, type = "text", value, onChange, onBlur,
  error, isPassword = false, showToggle, onToggle,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold tracking-widest text-amber-400/50 uppercase">
      {label}
    </label>
    <div className="relative">
      <input
        type={isPassword ? (showToggle ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={`Enter your ${label.toLowerCase()}`}
        className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200
          text-white/90 placeholder-amber-200/20 border
          ${error
            ? "border-red-500/40 bg-red-500/5 focus:border-red-500/60"
            : "border-amber-400/20 bg-amber-400/8 focus:border-amber-400/60 focus:bg-amber-400/12"
          }`}
        style={{ backdropFilter: "blur(8px)" }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/30 hover:text-amber-400/70 transition-colors"
        >
          {showToggle ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// ── Signup Page ────────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const bg = useTravelBackground();

  const [form, setForm]                   = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors]               = useState({});
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = (field, value) => {
    if (field === "name") {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 3) return "Name must be at least 3 characters.";
      if (!/^[a-zA-Z\s]+$/.test(value)) return "Letters and spaces only.";
    }
    if (field === "email") {
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    }
    if (field === "password") {
      if (!value) return "Password is required.";
      if (value.length < 8) return "At least 8 characters required.";
      if (!/[A-Z]/.test(value)) return "Must include at least 1 uppercase letter.";
      if (!/[0-9]/.test(value)) return "Must include at least 1 number.";
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return "Must include at least 1 special character.";
    }
    if (field === "confirmPassword") {
      if (!value) return "Please confirm your password.";
      if (value !== form.password) return "Passwords do not match.";
    }
    return "";
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleBlur   = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(form).forEach((f) => { const err = validate(f, form[f]); if (err) allErrors[f] = err; });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await client.post("/auth/register", { name: form.name, email: form.email, password: form.password });
      login(res.data.access_token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setErrors({ email: err.response?.data?.detail || "Signup failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setErrors({});
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const res = await client.post("/auth/google", {
          credential: tokenResponse.access_token,
          email: userInfo.email,
          name: userInfo.name,
        });
        login(res.data.access_token, res.data.user);
        navigate("/dashboard");
      } catch (err) {
        setErrors({ email: err.response?.data?.detail || "Google signup failed. Try again." });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setErrors({ email: "Google login was cancelled or failed." }),
  });

  const strengthChecks = [
    { check: form.password.length >= 8,                                                   label: "8+ characters"     },
    { check: /[A-Z]/.test(form.password),                                                 label: "Uppercase letter"  },
    { check: /[0-9]/.test(form.password),                                                 label: "One number"        },
    { check: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password),                 label: "Special character" },
  ];

  return (
    // ── Root: flex column on mobile (header strip on top, form below), flex row on desktop ──
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden relative">

      {/* ── FULL-SCREEN BACKGROUND IMAGE ── */}
      <div
        className={`absolute inset-0 bg-linear-to-br from-stone-800 via-stone-900 to-stone-800 transition-opacity duration-700 z-0 ${bg.loading ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: bg.bgUrl ? `url('${bg.bgUrl}')` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bg.loading ? 0 : 1,
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/40" />

      {/* ── MOBILE HEADER STRIP (visible only on mobile) ──
          Compact branding + tagline above the glass form panel. */}
      <div className="lg:hidden relative z-10 shrink-0 px-6 pt-8 pb-5">
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 cursor-pointer mb-3" onClick={() => navigate("/")}>
          <span className="font-serif text-white text-xl font-bold tracking-wide">
            Xplo<span className="text-amber-400">ra</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="relative z-10 font-serif text-white text-2xl font-black leading-snug mb-3 drop-shadow-lg">
          The world is<br />
          <span className="text-amber-400 italic">yours to explore.</span>
        </p>

        {/* Stats — compact horizontal row */}
        <div className="relative z-10 flex gap-6">
          {[["10K+", "Trips"], ["500+", "Destinations"], ["4.9★", "Rating"]].map(([val, label]) => (
            <div key={label}>
              <p className="font-serif text-amber-400 font-bold text-sm">{val}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEFT PANEL — desktop only ── */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-10 shrink-0">
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

        <div className="relative z-10 cursor-pointer" onClick={() => navigate("/")}>
          <span className="font-serif text-white text-2xl font-bold tracking-wide">
            Xplo<span className="text-amber-400">ra</span>
          </span>
        </div>

        <div className="relative z-10">
          <p className="font-serif text-white text-4xl font-black leading-snug max-w-sm mb-3 drop-shadow-lg">
            The world is<br />
            <span className="text-amber-400 italic">yours to explore.</span>
          </p>
          <p className="text-white/50 text-sm mb-8 font-light">
            Join thousands of travellers planning smarter trips with AI.
          </p>
          <div className="flex gap-8">
            {[["10K+", "Trips Planned"], ["500+", "Destinations"], ["4.9★", "Rating"]].map(([val, label]) => (
              <div key={label}>
                <p className="font-serif text-amber-400 font-bold text-lg">{val}</p>
                <p className="text-white/35 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {bg.photographer && !bg.loading && (
          <a
            href={`${bg.photographerUrl}?utm_source=xplora&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 text-[10px] text-white/25 hover:text-white/50 transition-colors self-start"
          >
            Photo by {bg.photographer} · Unsplash
          </a>
        )}
      </div>

      {/* ── FORM PANEL — full width on mobile, half width on desktop ──
          flex-1 ensures it fills the remaining vertical space below the mobile header. */}
      <div className="w-full lg:w-1/2 relative z-10 flex flex-col flex-1 lg:flex-none overflow-hidden shrink-0">

        {/* Golden frosted glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(217,119,6,0.28) 40%, rgba(161,98,7,0.32) 100%)",
            backdropFilter: "blur(18px) saturate(1.4)",
            WebkitBackdropFilter: "blur(18px) saturate(1.4)",
            borderLeft: "1px solid rgba(251,191,36,0.18)",
          }}
        />

        {/* Depth shimmer layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 60% 25%, rgba(251,191,36,0.18) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(245,158,11,0.14) 0%, transparent 55%)",
          }}
        />

        {/* Top border glow */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)" }}
        />

        {/* Scrollable form — responsive horizontal padding */}
        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-5 sm:px-8">
          <div className="w-full max-w-sm mx-auto py-6 lg:py-8">

            {/* Header */}
            <div className="mb-4 lg:mb-5">
              <p className="text-amber-300 text-[10px] font-bold tracking-widest uppercase mb-1.5">✦ Get Started</p>
              <h1 className="font-serif text-white text-3xl sm:text-4xl font-black leading-tight drop-shadow-lg">
                Create your<br />account.
              </h1>
            </div>

            {/* Toggle */}
            <div
              className="flex rounded-xl p-1 mb-4 lg:mb-5 border"
              style={{
                background: "rgba(251,191,36,0.08)",
                borderColor: "rgba(251,191,36,0.25)",
              }}
            >
              <button className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-amber-400 text-stone-900 shadow-lg shadow-amber-400/30">
                Sign Up
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                Log In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <InputField label="Full Name"        name="name"            value={form.name}            onChange={handleChange} onBlur={handleBlur} error={errors.name} />
              <InputField label="Email Address"    name="email"           type="email" value={form.email}           onChange={handleChange} onBlur={handleBlur} error={errors.email} />
              <InputField label="Password"         name="password"        value={form.password}        onChange={handleChange} onBlur={handleBlur} error={errors.password}        isPassword showToggle={showPassword} onToggle={() => setShowPassword(p => !p)} />
              <InputField label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} isPassword showToggle={showConfirm}  onToggle={() => setShowConfirm(p => !p)} />

              {/* Password strength */}
              {form.password && !errors.password && (
                <div
                  className="rounded-xl px-3 py-2 border"
                  style={{
                    background: "rgba(251,191,36,0.07)",
                    borderColor: "rgba(251,191,36,0.18)",
                  }}
                >
                  <p className="text-[9px] font-bold text-amber-400/40 uppercase tracking-widest mb-1.5">Password strength</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {strengthChecks.map(({ check, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${check ? "bg-emerald-400" : "bg-white/15"}`} />
                        <span className={`text-[10px] ${check ? "text-emerald-400" : "text-white/30"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full bg-amber-400 hover:bg-amber-300 text-stone-900 py-3 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-lg shadow-amber-400/30"
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.2)" }} />
              <span className="text-xs text-amber-200/40 font-medium">or continue with</span>
              <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.2)" }} />
            </div>

            {/* Google OAuth */}
            <button
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.22)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(251,191,36,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(251,191,36,0.08)"}
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              )}
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-amber-200/30 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                Sign in
              </Link>
            </p>

            {/* Unsplash credit — mobile only, shown at the bottom of the form */}
            {bg.photographer && !bg.loading && (
              <a
                href={`${bg.photographerUrl}?utm_source=xplora&utm_medium=referral`}
                target="_blank"
                rel="noopener noreferrer"
                className="lg:hidden block text-center text-[10px] text-white/20 hover:text-white/40 transition-colors mt-4"
              >
                Photo by {bg.photographer} · Unsplash
              </a>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;