import { useState, useEffect, useCallback } from 'react';
import { Search, LocateFixed, SlidersHorizontal } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import useDebounce from '../hooks/useDebounce';
import { searchNearbyPlaces } from '../api/placesApi';
import { getCategories } from '../api/categoriesApi';
import { useSearch } from '../context/SearchContext';
import SearchMap from '../components/SearchMap';
import PlaceCard from '../components/PlaceCard';
import LocationSearchBar from '../components/LocationSearchBar';
import RadiusSlider from '../components/ui/RadiusSlider';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const DEFAULT_CENTER = { lat: 28.6129, lng: 77.2295 }; // India Gate fallback

const SearchPage = () => {
  const {
    origin,
    setOrigin,
    radiusKm,
    setRadiusKm,
    keyword,
    setKeyword,
    categoryId,
    setCategoryId,
    places,
    setPlaces,
    activeId,
    setActiveId,
    dataSource,
    setDataSource,
  } = useSearch();

  const { coords, status: geoStatus, requestLocation } = useGeolocation(!origin);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 500);
  const debouncedRadius = useDebounce(radiusKm, 400);

  useEffect(() => {
    if (coords) {
      setOrigin(coords);
    } else if (!origin && (geoStatus === 'denied' || geoStatus === 'unsupported' || geoStatus === 'error')) {
      setOrigin(DEFAULT_CENTER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, geoStatus]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const runSearch = useCallback(async () => {
    if (!origin) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchNearbyPlaces({
        lat: origin.lat,
        lng: origin.lng,
        radiusKm: debouncedRadius,
        category: categoryId || undefined,
        keyword: debouncedKeyword || undefined,
      });
      setPlaces(data.places);
      setDataSource(data.dataSource);
      setActiveId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [origin, debouncedRadius, debouncedKeyword, categoryId, setPlaces, setDataSource, setActiveId]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const handleMapClick = (latlng) => {
    setOrigin(latlng);
  };

  // Location search bar selection — same effect as a manual pin-drop, just
  // via search instead of clicking the map.
  const handleLocationSelect = (latlng) => {
    setOrigin(latlng);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      <div className="flex w-full flex-col border-r border-gray-200 bg-white lg:h-full lg:w-105">
        <div className="border-b border-gray-200 p-4">
          <LocationSearchBar onSelect={handleLocationSelect} />

          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='Try "fresh lilies" or "best seafood"'
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-trippal-500 focus:border-transparent"
              />
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="px-3!">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={requestLocation} className="px-3!" title="Use my location">
              <LocateFixed className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 flex flex-col gap-4 rounded-lg bg-gray-50 p-3.5">
              <RadiusSlider value={radiusKm} onChange={setRadiusKm} />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {dataSource?.warning && (
          <div className="px-4 pt-3">
            <Alert variant="info">{dataSource.warning}</Alert>
          </div>
        )}
        {error && (
          <div className="px-4 pt-3">
            <Alert variant="error" onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-trippal-500 border-t-transparent" />
            </div>
          ) : places.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-gray-400">
              <p>No places found in this area yet.</p>
              <p className="mt-1">Try a larger radius or a denser location.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400">
                {places.length} place{places.length !== 1 ? 's' : ''} found
              </p>
              {places.map((place) => (
                <PlaceCard
                  key={place._id}
                  place={place}
                  isActive={activeId === place._id}
                  onClick={() => setActiveId(place._id)}
                  keyword={debouncedKeyword || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-[50vh] flex-1 lg:h-full">
        {origin && (
          <SearchMap
            center={origin}
            radiusKm={debouncedRadius}
            places={places}
            activeId={activeId}
            onMarkerClick={setActiveId}
            onMapClick={handleMapClick}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;