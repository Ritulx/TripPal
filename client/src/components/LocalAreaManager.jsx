import { useState } from 'react';
import { MapPinned, ShieldCheck, Clock, Trash2, Plus } from 'lucide-react';
import { addLocalArea, removeLocalArea } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import LocationSearchBar from './LocationSearchBar';
import Button from './ui/Button';
import Alert from './ui/Alert';

const RADIUS_OPTIONS = [2, 5, 10, 15, 20, 30, 50];

const LocalAreaManager = () => {
  const { user, refreshUser } = useAuth();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [picked, setPicked] = useState(null); // { lat, lng, formatted }
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const areas = user?.localAreas || [];

  const handlePick = (latlng, formatted) => setPicked({ ...latlng, formatted });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!picked) {
      setError('Search and select a location first');
      return;
    }
    setSaving(true);
    try {
      await addLocalArea({
        label: label || picked.formatted,
        coordinates: [picked.lng, picked.lat],
        radiusKm,
      });
      await refreshUser();
      setLabel('');
      setPicked(null);
      setAdding(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (areaId) => {
    setRemovingId(areaId);
    try {
      await removeLocalArea(areaId);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-400">
        Tips can only be posted inside areas you're verified local to. Add the places you
        actually know — an admin reviews each one before it unlocks tip posting there.
      </p>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {areas.length === 0 && !adding && (
          <p className="py-6 text-center text-sm text-gray-400">You haven't claimed any local areas yet.</p>
        )}
        {areas.map((area) => (
          <div key={area._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {area.label}
                  {area.location?.coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${area.location.coordinates[1]},${area.location.coordinates[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1.5 text-[11px] font-normal text-trippal-600 hover:underline"
                    >
                      (View on map)
                    </a>
                  )}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  {area.radiusKm}km radius ·{' '}
                  {area.isVerified ? (
                    <span className="flex items-center gap-0.5 text-trippal-600">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Clock className="h-3 w-3" /> Pending review
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemove(area._id)}
              disabled={removingId === area._id}
              className="text-gray-300 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          onSubmit={handleAdd}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-pink-200 bg-pink-50/40 p-3.5"
        >
          <LocationSearchBar onSelect={handlePick} placeholder="Search for the area you know..." />
          {picked && <p className="text-xs text-trippal-700">Selected: {picked.formatted}</p>}
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. My neighborhood)"
            maxLength={100}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Radius:</label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
            >
              {RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={saving} className="flex-1">
              Submit for review
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setPicked(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Claim a local area
        </Button>
      )}
    </div>
  );
};

export default LocalAreaManager;