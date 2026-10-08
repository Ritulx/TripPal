import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-3 text-center">
    <h1 className="text-5xl font-bold text-gray-900">404</h1>
    <p className="text-gray-500">This page doesn't exist.</p>
    <Link to="/" className="text-trippal-700 font-semibold hover:underline">
      Back home
    </Link>
  </div>
);

export default NotFoundPage;