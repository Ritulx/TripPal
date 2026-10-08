import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import { searchLocations } from '../api/placesApi';

/**
 * Autocomplete text search for picking a location — the alternative to
 * click-dropping a pin on the map. Calls the backend's Geoapify proxy
 * (never the Geoapify API directly, so the key stays server-side).
 */
const LocationSearchBar = ({ onSelect, placeholder = 'Search a city, area or address...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchLocations(debouncedQuery)
      .then((data) => {
        setResults(data.results || []);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result) => {
    onSelect({ lat: result.lat, lng: result.lng }, result.formatted);
    setQuery(result.formatted);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-8 text-sm
            focus:outline-none focus:ring-2 focus:ring-trippal-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-1000 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="text-gray-700">{r.formatted}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;