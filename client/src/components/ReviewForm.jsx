import { useState } from 'react';
import StarRatingInput from './ui/StarRatingInput';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { createReview } from '../api/reviewsApi';

const ReviewForm = ({ placeId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    setLoading(true);
    try {
      const data = await createReview({ place: placeId, rating, text });
      setText('');
      setRating(0);
      onSubmitted?.(data.review);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-800">Write a review</h4>
      {error && <Alert variant="error">{error}</Alert>}
      <StarRatingInput value={rating} onChange={setRating} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What did you order? What stood out?"
        rows={3}
        required
        minLength={3}
        maxLength={2000}
        className="rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
      />
      <Button type="submit" loading={loading} className="self-start">
        Submit review
      </Button>
    </form>
  );
};

export default ReviewForm;