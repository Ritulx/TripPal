import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notificationsApi';
import Button from '../components/ui/Button';

const NotificationsPage = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      getNotifications()
        .then(data => setNotifications(data.notifications))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
      } catch (err) {
        console.error(err);
      }
    }
    navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-trippal-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-sm text-trippal-600 font-medium hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            <p>No notifications yet. When tourists ask queries in your verified areas, they will appear here!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`rounded-lg border p-4 shadow-sm transition-colors ${notif.isRead ? 'bg-white border-gray-200 text-gray-600' : 'bg-green-50 border-green-200 text-gray-900'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleNotificationClick(notif)}>
                    Answer this query
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
