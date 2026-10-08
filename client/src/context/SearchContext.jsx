import { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext(null);

const STORAGE_KEY = 'trippal_origin';

/**
 * Holds search state (origin, radius, keyword, category, results) above the
 * route tree so it survives navigating away to a place's detail page and
 * back — without this, SearchPage's local state would reset on every
 * remount and the map would snap back to the default fallback location.
 */
export const SearchProvider = ({ children }) => {
  const [origin, setOrigin] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load origin from localStorage', err);
    }
    return null;
  });

  useEffect(() => {
    if (origin) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
      } catch (err) {
        console.error('Failed to save origin to localStorage', err);
      }
    }
  }, [origin]);

  const [radiusKm, setRadiusKm] = useState(5);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [places, setPlaces] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  const value = {
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
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider');
  return ctx;
};