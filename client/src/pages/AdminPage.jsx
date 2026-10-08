import { useState } from 'react';
import { LayoutDashboard, Flag, Star, FolderTree, UserCheck } from 'lucide-react';
import AdminStatsPanel from '../components/admin/AdminStatsPanel';
import TipModerationPanel from '../components/admin/TipModerationPanel';
import ReviewModerationPanel from '../components/admin/ReviewModerationPanel';
import CategoryManagerPanel from '../components/admin/CategoryManagerPanel';
import LocalVerificationPanel from '../components/admin/LocalVerificationPanel';

const TABS = [
  { key: 'stats', label: 'Overview', icon: LayoutDashboard },
  { key: 'tips', label: 'Tip Moderation', icon: Flag },
  { key: 'reviews', label: 'Review Moderation', icon: Star },
  { key: 'categories', label: 'Categories', icon: FolderTree },
  { key: 'locals', label: 'Local Verification', icon: UserCheck },
];

const AdminPage = () => {
  const [tab, setTab] = useState('stats');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Moderation, category management, and Local verification.</p>

      <div className="mt-6 flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors
              ${tab === key ? 'bg-white text-trippal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'stats' && <AdminStatsPanel />}
        {tab === 'tips' && <TipModerationPanel />}
        {tab === 'reviews' && <ReviewModerationPanel />}
        {tab === 'categories' && <CategoryManagerPanel />}
        {tab === 'locals' && <LocalVerificationPanel />}
      </div>
    </div>
  );
};

export default AdminPage;