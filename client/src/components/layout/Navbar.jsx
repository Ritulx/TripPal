import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, User, LogOut, ShieldCheck, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getNotifications } from '../../api/notificationsApi';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      getNotifications()
        .then(data => {
          const count = data.notifications.filter(n => !n.isRead).length;
          setUnreadCount(count);
        })
        .catch(err => console.error(err));
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-pink-100 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-trippal-700">
          <MapPin className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">TripPal</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-trippal-700"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link
                to="/notifications"
                className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-trippal-700"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-trippal-700"
              >
                <User className="h-4 w-4" />
                {user.name.split(' ')[0]}
                {user.karma > 0 && (
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-trippal-700">
                    {user.karma} karma
                  </span>
                )}
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="px-3!">
                    <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;