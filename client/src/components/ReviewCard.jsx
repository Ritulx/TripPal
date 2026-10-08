import { useState } from 'react';
import { Star, User, Pencil, Trash2, X, Check } from 'lucide-react';
import { updateReview, deleteReview } from '../api/reviewsApi';
import StarRatingInput from './ui/StarRatingInput';

const ReviewCard = ({ review, currentUserId, onUpdated }) => {
  const isOwner = currentUserId && String(review.user?._id || review.user) === String(currentUserId);

  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'deleting'
  const [editRating, setEditRating] = useState(review.rating);
  const [editText, setEditText] = useState(review.text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!editRating) { setError('Please select a rating'); return; }
    setSaving(true);
    setError('');
    try {
      await updateReview(review._id, { rating: editRating, text: editText });
      setMode('view');
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteReview(review._id);
      onUpdated?.();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-gray-500">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            {review.user?.name || review.authorName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Star rating — static in view mode */}
          {mode === 'view' && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-3.5 w-3.5 ${n <= review.rating ? 'fill-pink-400 text-pink-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
          )}

          {/* Owner action buttons */}
          {isOwner && mode === 'view' && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => { setEditRating(review.rating); setEditText(review.text); setMode('edit'); setError(''); }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-trippal-600 transition-colors"
                title="Edit review"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMode('deleting')}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Delete review"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View mode */}
      {mode === 'view' && (
        <>
          <p className="mt-2 text-sm text-gray-600">{review.text}</p>
          <p className="mt-1 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
        </>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <div className="mt-3 flex flex-col gap-2">
          <StarRatingInput value={editRating} onChange={setEditRating} />
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={2000}
            className="rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-green-300 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setMode('view'); setError(''); }}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {mode === 'deleting' && (
        <div className="mt-2 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700 font-medium">Delete this review?</p>
          <p className="mt-0.5 text-xs text-red-500">This can't be undone.</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => { setMode('view'); setError(''); }}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;