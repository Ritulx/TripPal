import { useEffect, useState } from 'react';
import { MapPin, Star, Lightbulb, Users, AlertTriangle, Database } from 'lucide-react';
import { getSystemStats } from '../../api/adminApi';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className={`mb-2 inline-flex rounded-lg p-2 ${accent}`}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const AdminStatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSystemStats()
      .then((d) => setStats(d.stats))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!stats) return <div className="h-24 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={MapPin} label="Active places" value={stats.places} accent="bg-pink-50 text-trippal-600" />
        <StatCard icon={Star} label="Reviews" value={stats.reviews} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={Lightbulb} label="Local tips" value={stats.tips} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={Users} label="Active users" value={stats.users} accent="bg-purple-50 text-purple-600" />
        <StatCard
          icon={AlertTriangle}
          label="Flagged tips awaiting review"
          value={stats.flaggedTipsAwaitingReview}
          accent="bg-red-50 text-red-600"
        />
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
        <Database className="h-4 w-4 text-gray-400" />
        <span>
          {stats.ingestionCache.activeCacheEntries} active ingestion cache entr
          {stats.ingestionCache.activeCacheEntries !== 1 ? 'ies' : 'y'}
          {stats.ingestionCache.newestEntry &&
            ` · last refreshed ${new Date(stats.ingestionCache.newestEntry).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
};

export default AdminStatsPanel;