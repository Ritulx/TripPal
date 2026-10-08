import { Star, TrendingUp } from 'lucide-react';

const ScoreBadge = ({ score, avgRating, reviewCount }) => {
  if (!score) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1 rounded-full bg-pink-50 px-2 py-1 font-semibold text-pink-400">
        <Star className="h-3 w-3 fill-pink-500 text-pink-500" />
        {avgRating?.toFixed(1) || '—'} ({reviewCount || 0})
      </span>
      <span
        className="flex items-center gap-1 rounded-full bg-pink-50 px-2 py-1 font-semibold text-trippal-700"
        title="Local Preference Score — based on rating quality × number of reviews"
      >
        <TrendingUp className="h-3 w-3" />
        Score {score.localScore?.toFixed(2) ?? '—'}
      </span>
      {score.keywordMatchedReviews > 0 && (
        <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-700">
          {score.keywordMatchedReviews} matching review{score.keywordMatchedReviews !== 1 ? 's' : ''}
        </span>
      )}
      {score.totalTips > 0 && (
        <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-700">
          {score.totalTips} local tip{score.totalTips !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;