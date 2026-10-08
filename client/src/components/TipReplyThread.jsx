import { useState, useEffect, useRef } from 'react';
import { User, Trash2, ArrowBigUp, ArrowBigDown, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getReplies, createReply, deleteReply, voteReply } from '../api/tipRepliesApi';

// ─── Single Reply Row ─────────────────────────────────────────────────────────
const ReplyRow = ({ reply, tipId, currentUserId, onDeleted }) => {
  const isOwn = currentUserId && String(reply.author?._id || reply.author) === String(currentUserId);

  // Derive initial vote from the arrays returned by the server
  const getInitialVote = () => {
    const uid = String(currentUserId);
    if ((reply.upvotes || []).some((id) => String(id) === uid)) return 'up';
    if ((reply.downvotes || []).some((id) => String(id) === uid)) return 'down';
    return null;
  };

  const [netVotes, setNetVotes] = useState(reply.netVotes ?? 0);
  const [userVote, setUserVote] = useState(getInitialVote());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async (direction) => {
    if (!currentUserId) return;
    if (isOwn) return;
    try {
      const data = await voteReply(tipId, reply._id, direction);
      setNetVotes(data.netVotes);
      setUserVote(data.userVote);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReply(tipId, reply._id);
      onDeleted(reply._id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 py-2">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <button
          onClick={() => handleVote('up')}
          disabled={isOwn || !currentUserId}
          title={!currentUserId ? 'Log in to vote' : isOwn ? "Can't vote your own reply" : 'Upvote'}
          className={`rounded-sm p-0.5 transition-all disabled:opacity-30 ${
            userVote === 'up'
              ? 'text-orange-500'
              : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'
          }`}
        >
          <ArrowBigUp
            className={`h-5 w-5 ${userVote === 'up' ? 'fill-orange-500' : ''}`}
            strokeWidth={1.5}
          />
        </button>
        <span className={`text-[11px] font-bold leading-none ${
          netVotes > 0 ? 'text-orange-500' : netVotes < 0 ? 'text-blue-500' : 'text-gray-400'
        }`}>
          {netVotes}
        </span>
        <button
          onClick={() => handleVote('down')}
          disabled={isOwn || !currentUserId}
          title={!currentUserId ? 'Log in to vote' : isOwn ? "Can't vote your own reply" : 'Downvote'}
          className={`rounded-sm p-0.5 transition-all disabled:opacity-30 ${
            userVote === 'down'
              ? 'text-blue-500'
              : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
          }`}
        >
          <ArrowBigDown
            className={`h-5 w-5 ${userVote === 'down' ? 'fill-blue-500' : ''}`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-700">
            {reply.author?.name || reply.authorName}
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Delete reply"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{reply.text}</p>
        {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
      </div>
    </div>
  );
};

// ─── Reply Thread Panel ───────────────────────────────────────────────────────
const TipReplyThread = ({ tipId }) => {
  const { isAuthenticated, user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Load replies when thread is opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getReplies(tipId)
      .then((data) => setReplies(data.replies))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, tipId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await createReply(tipId, text.trim());
      setReplies((prev) => [...prev, data.reply]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleted = (replyId) => {
    setReplies((prev) => prev.filter((r) => r._id !== replyId));
  };

  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-trippal-600 transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {open ? 'Hide' : (replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Reply')}
      </button>

      {open && (
        <div className="mt-2 pl-1">
          {/* Replies list */}
          {loading ? (
            <div className="flex items-center gap-1.5 py-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading replies…
            </div>
          ) : replies.length === 0 ? (
            <p className="py-1 text-[11px] text-gray-400 italic">No replies yet — be the first!</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {replies.map((r) => (
                <ReplyRow
                  key={r._id}
                  reply={r}
                  tipId={tipId}
                  currentUserId={user?._id}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}

          {/* Compose box */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-trippal-600">
                  <User className="h-3 w-3" />
                </div>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a reply…"
                  rows={2}
                  maxLength={500}
                  className="flex-1 resize-none rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-trippal-400"
                />
              </div>
              {error && <p className="text-[10px] text-red-500 pl-8">{error}</p>}
              <div className="flex justify-end pl-8">
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-pink-400 px-4 py-1.5 text-xs font-semibold text-white hover:bg-pink-500 disabled:opacity-40 transition-colors"
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {submitting ? 'Posting…' : 'Reply'}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400 italic pl-8">
              <a href="/login" className="text-trippal-600 hover:underline font-medium">Log in</a> to reply.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TipReplyThread;
