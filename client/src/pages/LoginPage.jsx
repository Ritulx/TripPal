import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, UtensilsCrossed, Scissors, Flower2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div 
      className="relative hidden w-1/2 overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between bg-cover bg-center"
      style={{ backgroundImage: `url('/download.jpeg')` }}
      >
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-10 top-16 h-24 w-40 -rotate-3 rounded-2xl bg-trippal-200" />
          <div className="absolute left-16 top-32 h-16 w-56 rotate-2 rounded-2xl bg-trippal-200" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-trippal-800">
          <MapPin className="h-6 w-6" />
          <span className="text-lg font-bold">TripPal</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">
            Find what locals
            <br />
            actually love nearby
          </h2>
          <p className="mt-3 max-w-sm text-sm text-gray-800">
            Set a custom radius, search by what you're craving, and see places ranked by real local
            reviews and tips.
          </p>
          <div className="mt-8 flex gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 shadow-sm">
              <Scissors className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div />
      </div>

      <div className="flex w-full items-center justify-center bg-pink-50 px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Log in to save places and post local tips.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-trippal-700 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;