import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/Loading';
import toast from 'react-hot-toast';

const PERKS = [
  'Save your prediction history',
  'Dashboard with real-time stats',
  'Save articles for later',
  'Filter & search past analyses',
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.includes('@'))                    e.email = 'Enter a valid email address';
    if (password.length < 8)                     e.password = 'Password must be at least 8 characters';
    if (password !== confirm)                    e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await authApi.register({ name: name.trim(), email, password });
      login(res.access_token, res.user);
      toast.success(`Account created! Welcome, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const strengthLevel = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)  s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = strengthLevel();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][strength];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left panel – perks (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary-700 to-primary-900 text-white flex-col justify-center p-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10" />
            <span className="text-2xl font-extrabold">TruthLens</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Your personal<br />fact-check companion
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed">
            Create a free account to unlock your personal history, dashboard statistics,
            and bookmarked articles.
          </p>
          <ul className="space-y-3 mt-4">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create an account</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              Free forever · No credit card required
            </p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errors.form && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {errors.form}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input id="name" type="text" autoComplete="name" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="label">Email address</label>
                <input id="reg-email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-pw" className="label">Password</label>
                <div className="relative">
                  <input id="reg-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">{strengthLabel}</p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="confirm" className="label">Confirm password</label>
                <input id="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={`input-field ${errors.confirm ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
                {loading ? <Spinner size="sm" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
