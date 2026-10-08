import { useState, useEffect, useCallback } from 'react';

/**
 * Wraps the browser Geolocation API. Returns { coords, status, error, requestLocation }.
 * status: 'idle' | 'locating' | 'success' | 'denied' | 'unsupported' | 'error'
 */
const useGeolocation = (autoRequest = true) => {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('success');
      },
      (err) => {
        setError(err.message);
        setStatus(err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (autoRequest) requestLocation();
  }, [autoRequest, requestLocation]);

  return { coords, status, error, requestLocation, setCoords };
};

export default useGeolocation;