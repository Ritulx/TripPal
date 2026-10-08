import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getSuspiciousReviews, purgeReview } from '../../api/adminApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const ReviewModerationPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getSuspiciousReviews()
      .then((d) => setReviews(d.reviews))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePurge = async (id) => {
    setError('');
    try {
      await purgeReview(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-400">
        Reviews with unusually high keyword density (15+ extracted phrases) — a common
        keyword-stuffing pattern (SRS Risk R-04). Shown for manual review, not auto-removed.
      </p>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No suspicious reviews flagged right now.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="rounded-lg border border-gray-200 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{review.place?.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{review.text}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {review.rating}★ by {review.user?.name || review.authorName} ·{' '}
                    {review.extractedKeywords?.length} keywords extracted
                  </p>
                </div>
                <Button variant="danger" className="px-2.5! py-1.5!" onClick={() => handlePurge(review._id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewModerationPanel;