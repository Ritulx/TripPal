import { useEffect, useState } from 'react';
import { ShieldCheck, Star, Lightbulb, History, MapPinned } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyReviews } from '../api/reviewsApi';
import { getMyTips } from '../api/tipsApi';
import { getSearchHistory } from '../api/authApi';
import PreferencesEditor from '../components/PreferencesEditor';
import LocalAreaManager from '../components/LocalAreaManager';

const TABS = [
  { key: 'reviews', label: 'My Reviews', icon: Star },
  { key: 'tips', label: 'My Tips', icon: Lightbulb },
  { key: 'areas', label: 'Local Areas', icon: MapPinned },
  { key: 'history', label: 'Search History', icon: History },
];

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-10 text-center">
    <Icon className="h-6 w-6 text-gray-300" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [tips, setTips] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyReviews(), getMyTips(), getSearchHistory()])
      .then(([r, t, h]) => {
        setReviews(r.reviews);
        setTips(t.tips);
        setHistory(h.history);
      })
      .finally(() => setLoading(false));
  }, []);

  const verifiedAreaCount = (user.localAreas || []).filter((a) => a.isVerified).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-xl font-bold text-trippal-700">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            {user.name}
            {verifiedAreaCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-trippal-700">
                <ShieldCheck className="h-3 w-3" /> Local in {verifiedAreaCount} area
                {verifiedAreaCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">
            {user.email} · <span className="font-medium text-trippal-700">{user.karma} karma</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <PreferencesEditor initialPreferences={user.preferences} onSaved={refreshUser} />
        </div>

        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors
                  ${tab === key ? 'bg-white text-trippal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === 'areas' ? (
              <LocalAreaManager />
            ) : loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-trippal-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {tab === 'reviews' &&
                  (reviews.length === 0 ? (
                    <EmptyState icon={Star} text="You haven't written any reviews yet." />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {reviews.map((r) => (
                        <div key={r._id} className="rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{r.place?.name}</span>
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  ))}

                {tab === 'tips' &&
                  (tips.length === 0 ? (
                    <EmptyState icon={Lightbulb} text="You haven't shared any tips yet." />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {tips.map((t) => (
                        <div key={t._id} className="rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{t.place?.name}</span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-500">
                              {t.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{t.tipText}</p>
                          <p className="mt-1 text-xs text-trippal-600">Net votes: {t.netVotes}</p>
                        </div>
                      ))}
                    </div>
                  ))}

                {tab === 'history' &&
                  (history.length === 0 ? (
                    <EmptyState icon={History} text="No search history yet." />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {history.map((h) => (
                        <div
                          key={h._id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-xs"
                        >
                          <span className="text-gray-600">
                            {h.keyword ? `"${h.keyword}"` : 'Browse'} · {h.radius}km
                            {h.category?.name && ` · ${h.category.name}`}
                          </span>
                          <span className="text-gray-400">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;