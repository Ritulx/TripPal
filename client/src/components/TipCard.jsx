import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, Flag, User } from 'lucide-react';
import { voteTip, flagTip } from '../api/tipsApi';
import { useAuth } from '../context/AuthContext';
import TipReplyThread from './TipReplyThread';

const TipCard = ({ tip, onUpdated }) => {
  const { isAuthenticated, user } = useAuth();

  // Derive initial vote state from the arrays the server returns on load
  const getInitialVote = () => {
    if (!user) return null;
    const uid = String(user._id);
    if ((tip.upvotes || []).some((id) => String(id) === uid)) return 'up';
    if ((tip.downvotes || []).some((id) => String(id) === uid)) return 'down';
    return null;
  };

  const [netVotes, setNetVotes] = useState(tip.netVotes ?? 0);
  const [userVote, setUserVote] = useState(getInitialVote());
  const [error, setError] = useState('');
  const [flagged, setFlagged] = useState(
    user ? (tip.flaggedBy || []).some((id) => String(id) === String(user._id)) : false
  );

  const isOwnTip = user && String(tip.local?._id || tip.local) === String(user._id);

  const handleVote = async (direction) => {
    if (!isAuthenticated) { setError('Log in to vote'); return; }
    if (isOwnTip) return;
    setError('');
    try {
      const data = await voteTip(tip._id, direction);
      setNetVotes(data.netVotes);
      setUserVote(data.userVote); // server returns null | 'up' | 'down'
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFlag = async () => {
    if (!isAuthenticated) { setError('Log in to flag'); return; }
    try {
      await flagTip(tip._id);
      setFlagged(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Vote score color — matches Reddit convention
  const scoreColor =
    netVotes > 0 ? 'text-orange-500' :
    netVotes < 0 ? 'text-blue-500' :
    'text-gray-400';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5">
      <div className="flex gap-3">
        {/* ── Reddit-style vote column ── */}
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          {/* Upvote */}
          <button
            onClick={() => handleVote('up')}
            disabled={isOwnTip || !isAuthenticated}
            title={!isAuthenticated ? 'Log in to vote' : isOwnTip ? "Can't vote your own tip" : 'Upvote'}
            className={`rounded-sm p-0.5 transition-all disabled:opacity-30 ${
              userVote === 'up'
                ? 'text-orange-500'
                : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'
            }`}
          >
            <ArrowBigUp
              className={`h-6 w-6 ${userVote === 'up' ? 'fill-orange-500' : ''}`}
              strokeWidth={1.5}
            />
          </button>

          {/* Net vote count */}
          <span className={`text-xs font-bold leading-none tabular-nums ${scoreColor}`}>
            {netVotes}
          </span>

          {/* Downvote */}
          <button
            onClick={() => handleVote('down')}
            disabled={isOwnTip || !isAuthenticated}
            title={!isAuthenticated ? 'Log in to vote' : isOwnTip ? "Can't vote your own tip" : 'Downvote'}
            className={`rounded-sm p-0.5 transition-all disabled:opacity-30 ${
              userVote === 'down'
                ? 'text-blue-500'
                : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
            }`}
          >
            <ArrowBigDown
              className={`h-6 w-6 ${userVote === 'down' ? 'fill-blue-500' : ''}`}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* ── Tip content ── */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 leading-relaxed">{tip.tipText}</p>

          {/* Auto-extracted keyword tags */}
          {tip.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tip.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Author row */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium text-gray-600">{tip.local?.name || 'Local'}</span>
              {tip.local?.karma > 0 && (
                <span className="text-trippal-600">· {tip.local.karma} karma</span>
              )}
              <span className="text-gray-300">·</span>
              <span>{new Date(tip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>

            {!flagged ? (
              <button
                onClick={handleFlag}
                className="flex items-center gap-1 hover:text-red-500 transition-colors"
              >
                <Flag className="h-3 w-3" />
                Report
              </button>
            ) : (
              <span className="text-red-400">Reported</span>
            )}
          </div>

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

          {/* ── Reddit-style reply thread ── */}
          <TipReplyThread tipId={tip._id} />
        </div>
      </div>
    </div>
  );
};

export default TipCard;