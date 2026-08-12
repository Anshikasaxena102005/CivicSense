import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name     = 'Name is required';
    if (!form.email.trim())       e.email    = 'Email is required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must include a number';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to CivicSense.');
      navigate('/citizen', { replace: true });
    } catch (err) {
      if (err.errors) {
        const map = {};
        err.errors.forEach((e) => { map[e.field] = e.message; });
        setErrors(map);
      } else {
        toast.error(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-primary-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join CivicSense as a citizen</p>
        </div>

        <div className="card">
          <div className="card-body !p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="reg-name" type="text" name="name" value={form.name} onChange={handleChange}
                    className={`form-input pl-9 ${errors.name ? 'border-red-400' : ''}`}
                    placeholder="Ramesh Kumar" required />
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="reg-email" type="email" name="email" value={form.email} onChange={handleChange}
                    className={`form-input pl-9 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@example.com" required />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="reg-password" type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                    className={`form-input pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number" required />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="reg-phone" type="tel" name="phone" value={form.phone} onChange={handleChange}
                    className="form-input pl-9" placeholder="+91 98765 43210" />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
