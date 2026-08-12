import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const dashMap = { citizen: '/citizen', officer: '/officer', admin: '/admin' };
      navigate(dashMap[user.role] || '/citizen', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      citizen: { email: 'citizen@civicsense.local', password: 'Citizen@123' },
      officer: { email: 'raj@civicsense.local',     password: 'Officer@123' },
      admin:   { email: 'admin@civicsense.local',   password: 'Admin@123' },
    };
    setForm(demos[role]);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 mb-8">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            CivicSense
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed mb-8">
            Report civic issues. Track resolutions. Make your city better.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🏙️', text: 'Report potholes, power outages & more' },
              { icon: '📊', text: 'Real-time issue tracking' },
              { icon: '👮', text: 'Direct officer assignment' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white/80 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CivicSense</h1>
          </div>

          <div className="card">
            <div className="card-body !p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input pl-9"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="form-input pl-9 pr-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400 text-center mb-3">Quick access (demo)</p>
                <div className="grid grid-cols-3 gap-2">
                  {['citizen', 'officer', 'admin'].map((role) => (
                    <button key={role} onClick={() => fillDemo(role)} className="btn-secondary text-xs capitalize py-1.5">
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                New citizen?{' '}
                <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
