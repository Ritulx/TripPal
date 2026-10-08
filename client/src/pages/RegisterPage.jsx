import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, UtensilsCrossed, Scissors, Flower2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // No role field — everyone registers the same way. "Local" status is
  // claimed per-area afterward, from a place's page or the dashboard.
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
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
          <div className="absolute left-10 top-16 h-24 w-40 -rotate-3 rounded-2xl bg-pink-200" />
          <div className="absolute left-16 top-32 h-16 w-56 rotate-2 rounded-2xl bg-pink-200" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-trippal-800">
          <MapPin className="h-6 w-6" />
          <span className="text-lg font-bold">TripPal</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">
            Discover what
            <br />
            locals actually love
          </h2>
          <p className="mt-3 max-w-sm text-sm text-gray-600">
            Anyone can explore. If you know an area well, claim it from that place's page and
            share tips once an admin verifies you there.
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

      <div className="flex w-full items-center justify-center bg-white px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join TripPal in under a minute.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              id="name"
              name="name"
              label="Full name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
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
              placeholder="At least 8 characters, 1 number"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-trippal-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;