import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { getScoreBreakdown } from '../api/placesApi';

const ScoreBreakdownPanel = ({ placeId }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getScoreBreakdown(placeId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [placeId]);

  if (error || !data) return null;

  const { variables, results } = data;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <TrendingUp className="h-4 w-4 text-trippal-600" />
        Why this ranking?
      </h4>
      <p className="mt-1 text-xs text-gray-500">
        Score = (rating × reviews) ÷ (reviews + {variables.reviewAnchor}) — places locals genuinely prefer rise to the top.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
        <span>Avg rating</span>
        <span className="font-medium text-gray-900">{variables.avgRating?.toFixed(1)}</span>
        <span>Total reviews</span>
        <span className="font-medium text-gray-900">{variables.reviewCount}</span>
      </div>
      <div className="mt-3 border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-400">Local Preference Score</p>
        <p className="text-lg font-bold text-trippal-700">{results.localScore?.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ScoreBreakdownPanel;