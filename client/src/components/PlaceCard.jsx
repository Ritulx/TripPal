import { Link } from 'react-router-dom';
import { MapPin, Navigation, MessageSquareQuote, Star } from 'lucide-react';
import ScoreBadge from './ui/ScoreBadge';

/**
 * Highlights the search keyword inside a snippet of text.
 * Returns an array of React elements (plain strings + <mark> spans).
 */
const HighlightedText = ({ text, keyword }) => {
  if (!keyword || !text) return <span>{text}</span>;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="rounded bg-yellow-100 px-0.5 font-semibold text-yellow-800 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const PlaceCard = ({ place, isActive, onClick, keyword }) => {
  const snippets = place.matchedSnippets || [];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all
        ${isActive ? 'border-green-500 bg-green-50 shadow-sm' : 'border-pink-200 bg-white hover:border-pink-300'}`}
    >
      {/* Name + distance */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{place.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {place.address || 'Address not available'}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-pink-100 px-2 py-1 text-xs font-medium text-pink-600">
          <Navigation className="h-3 w-3" />
          {place.distanceKm} km
        </span>
      </div>

      {/* Category pill */}
      {place.category?.name && (
        <span className="mt-2 inline-block rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {place.category.name}
        </span>
      )}

      {/* Score + stats */}
      <div className="mt-3">
        <ScoreBadge score={place.score} avgRating={place.avgRating} reviewCount={place.reviewCount} />
      </div>

      {/* Matched snippets — only shown during a keyword search */}
      {snippets.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {snippets.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2"
            >
              {s.type === 'tip' ? (
                <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              ) : (
                <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              )}
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-800">{s.author}</span>
                {s.type === 'tip' ? ' posted ' : ' reviewed '}
                &ldquo;<HighlightedText text={s.text} keyword={keyword} />&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {place.aggregatedTags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {place.aggregatedTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-[11px] text-pink-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/places/${place._id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 inline-block text-xs font-semibold text-trippal-700 hover:underline"
      >
        View details &amp; reviews →
      </Link>
    </div>
  );
};

export default PlaceCard;