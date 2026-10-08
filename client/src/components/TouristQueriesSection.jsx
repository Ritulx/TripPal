import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getQueries, createQuery, replyToQuery, deleteQuery } from '../api/queriesApi';
import Button from './ui/Button';

const QueryCard = ({ query, currentUserId, onDeleted }) => {
  const isOwn = currentUserId && String(query.tourist?._id || query.tourist) === String(currentUserId);
  const [replies, setReplies] = useState(query.replies || []);
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await replyToQuery(query._id, replyText.trim());
      setReplies([...replies, data.reply]);
      setReplyText('');
      setShowReplyBox(false);
    } catch (err) {
      setError(err.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuery(query._id);
      onDeleted(query._id);
    } catch (err) {
      setError(err.message || 'Failed to delete query.');
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-500">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {query.tourist?.name || 'Tourist'}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {new Date(query.createdAt).toLocaleDateString()}
          </span>
        </div>
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete query"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-800 mb-3">{query.text}</p>
      
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* Replies Section */}
      <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-3">
        {replies.map((reply) => (
          <div key={reply._id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-700">
                {reply.local?.name || 'Local'}
              </span>
              {reply.local?.karma > 0 && (
                <span className="text-[10px] font-medium text-trippal-600">
                  · {reply.local.karma} karma
                </span>
              )}
              <span className="text-[10px] text-gray-400 ml-1">
                {new Date(reply.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-gray-600">{reply.text}</p>
          </div>
        ))}
        
        {currentUserId && (
          <div className="pt-2">
            {!showReplyBox ? (
              <button
                onClick={() => setShowReplyBox(true)}
                className="text-xs font-semibold text-trippal-600 hover:underline"
              >
                Reply as Local
              </button>
            ) : (
              <form onSubmit={handleReplySubmit} className="flex flex-col gap-2 mt-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Answer this query..."
                  rows={2}
                  maxLength={500}
                  className="resize-none rounded-lg border border-gray-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-trippal-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyBox(false);
                      setError('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !replyText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-green-300 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-400 disabled:opacity-40 transition-colors"
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Reply
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TouristQueriesSection = ({ placeId }) => {
  const { isAuthenticated, user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAskBox, setShowAskBox] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [askError, setAskError] = useState('');

  useEffect(() => {
    getQueries(placeId)
      .then((data) => setQueries(data.queries))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [placeId]);

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setSubmitting(true);
    setAskError('');
    try {
      const data = await createQuery(placeId, queryText.trim());
      setQueries([data.query, ...queries]);
      setQueryText('');
      setShowAskBox(false);
    } catch (err) {
      setAskError(err.message || 'Failed to post query.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleted = (queryId) => {
    setQueries(queries.filter(q => q._id !== queryId));
  };

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading queries...</div>;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-pink-300" />
          Tourist Queries ({queries.length})
        </h2>
        {isAuthenticated && !showAskBox && (
          <Button size="sm" onClick={() => setShowAskBox(true)}>
            Ask query
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {showAskBox && (
        <form onSubmit={handleAskSubmit} className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Ask a query about this place</h4>
          {askError && <p className="text-xs text-red-500 mb-2">{askError}</p>}
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="What do you want to know?"
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAskBox(false);
                setAskError('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5"
            >
              Cancel
            </button>
            <Button type="submit" disabled={submitting || !queryText.trim()}>
              {submitting ? 'Posting...' : 'Post query'}
            </Button>
          </div>
        </form>
      )}

      {queries.length === 0 ? (
        <p className="text-sm text-gray-400">No queries yet. Be the first to ask!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {queries.map((q) => (
            <QueryCard 
              key={q._id} 
              query={q} 
              currentUserId={user?._id} 
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TouristQueriesSection;
