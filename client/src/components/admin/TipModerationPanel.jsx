import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { getFlaggedTips, moderateTip } from '../../api/adminApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const STATUS_OPTIONS = ['flagged', 'pending', 'approved', 'removed'];

const TipModerationPanel = () => {
  const [status, setStatus] = useState('flagged');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getFlaggedTips(status)
      .then((d) => setTips(d.tips))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const handleModerate = async (id, action) => {
    setError('');
    try {
      await moderateTip(id, action);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors
              ${status === s ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ) : tips.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No tips with status "{status}".</p>
        ) : (
          tips.map((tip) => (
            <div key={tip._id} className="rounded-lg border border-gray-200 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tip.place?.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{tip.tipText}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    by {tip.local?.name} ({tip.local?.email}) · {tip.flagCount || 0} flag
                    {tip.flagCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {status !== 'removed' && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="primary"
                      className="px-2.5! py-1.5!"
                      onClick={() => handleModerate(tip._id, 'approve')}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2.5! py-1.5!"
                      onClick={() => handleModerate(tip._id, 'remove')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TipModerationPanel;