import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Star } from 'lucide-react';
import { getPlaceById } from '../api/placesApi';
import { getReviewsForPlace } from '../api/reviewsApi';
import { getTipsForPlace } from '../api/tipsApi';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import TipCard from '../components/TipCard';
import TipForm from '../components/TipForm';
import ScoreBreakdownPanel from '../components/ScoreBreakdownPanel';
import TouristQueriesSection from '../components/TouristQueriesSection';
import Alert from '../components/ui/Alert';

const PlaceDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [placeData, reviewData, tipData] = await Promise.all([
        getPlaceById(id),
        getReviewsForPlace(id),
        getTipsForPlace(id),
      ]);
      setPlace(placeData.place);
      setReviews(reviewData.reviews);
      setTips(tipData.tips);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshReviews = () => getReviewsForPlace(id).then((d) => setReviews(d.reviews));
  const refreshTips = () => getTipsForPlace(id).then((d) => setTips(d.tips));

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-trippal-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Alert variant="error">{error || 'Place not found'}</Alert>
        <Link to="/search" className="mt-4 inline-block text-sm text-trippal-700 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/search" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-trippal-700">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mt-4">
        <span className="rounded-md bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
          {place.category?.name}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{place.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {place.address || 'Address unavailable'}
          </span>
          {place.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" /> {place.phone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-pink-400 text-pink-400" />
            {place.avgRating?.toFixed(1) || '—'} ({place.reviewCount} review
            {place.reviewCount !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className="mt-6">
        <ScoreBreakdownPanel placeId={id} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">Local Tips ({tips.length})</h2>
        <div className="mt-3 flex flex-col gap-3">
          {isAuthenticated && <TipForm placeId={id} placeLocation={place.location} onSubmitted={refreshTips} />}
          {tips.length === 0 ? (
            <p className="text-sm text-gray-400">No local tips yet.</p>
          ) : (
            tips.map((tip) => <TipCard key={tip._id} tip={tip} onUpdated={refreshTips} />)
          )}
        </div>
        </section>

      <TouristQueriesSection placeId={id} />

      <section className="mb-10 mt-8">
        <h2 className="text-lg font-bold text-gray-900">Reviews ({reviews.length})</h2>
        <div className="mt-3 flex flex-col gap-3">
          {isAuthenticated && <ReviewForm placeId={id} onSubmitted={refreshReviews} />}
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => <ReviewCard key={r._id} review={r} currentUserId={user?._id} onUpdated={refreshReviews} />)
          )}
        </div>
      </section>
    </div>
  );
};

export default PlaceDetailPage;