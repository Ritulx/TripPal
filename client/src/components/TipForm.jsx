import { useState, useEffect } from 'react';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { createTip } from '../api/tipsApi';
import { addLocalArea } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const EARTH_RADIUS_KM = 6378.1;
const haversineDistanceKm = ([lng1, lat1], [lng2, lat2]) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RADIUS_OPTIONS = [2, 5, 10, 15, 20, 30, 50];

// ─── Lightweight client-side keyword extractor ────────────────────────────────
// Mirrors the server's keywordTokenizer so locals can preview extracted keywords
// as they type. The server always re-runs the canonical version on save.
const STOPWORDS = new Set([
  'a','an','the','and','or','but','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','shall','should','can',
  'could','may','might','must','this','that','these','those','i','you','he',
  'she','it','we','they','them','their','what','which','who','whom','to','of',
  'in','on','at','by','for','with','about','against','between','into','through',
  'during','before','after','above','below','from','up','down','out','off',
  'over','under','again','further','then','once','here','there','when','where',
  'why','how','all','any','both','each','few','more','most','other','some',
  'such','no','nor','not','only','own','same','so','than','too','very','just',
  'really','also','my','me','us','our','get','got','went','go','going','one',
  'place','places','im','ive','its',
]);

const extractPreviewKeywords = (text) => {
  if (!text || text.trim().length < 3) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  const tokens = new Set(words);
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }
  // Show only single-word tokens in the preview to keep the UI tidy
  return [...new Set(words)].slice(0, 12);
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `placeLocation` is the place's GeoJSON location ({ coordinates: [lng,lat] }),
 * passed down from PlaceDetailPage. Local status is now place-scoped, so this
 * form checks the CURRENT user's verified localAreas against THIS place's
 * coordinates, rather than trusting a global role/flag.
 */
const TipForm = ({ placeId, placeLocation, onSubmitted }) => {
  const { user, refreshUser } = useAuth();
  const [tipText, setTipText] = useState('');
  const [previewKeywords, setPreviewKeywords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [claimLabel, setClaimLabel] = useState('');
  const [claimRadius, setClaimRadius] = useState(5);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimed, setClaimed] = useState(false);

  // Update keyword preview whenever tip text changes
  useEffect(() => {
    setPreviewKeywords(extractPreviewKeywords(tipText));
  }, [tipText]);

  if (!user) return null;

  const placeCoords = placeLocation?.coordinates;

  const verifiedAreaHere =
    placeCoords &&
    (user.localAreas || []).find(
      (area) => area.isVerified && haversineDistanceKm(area.location.coordinates, placeCoords) <= area.radiusKm
    );

  const pendingAreaHere =
    placeCoords &&
    (user.localAreas || []).find(
      (area) => !area.isVerified && haversineDistanceKm(area.location.coordinates, placeCoords) <= area.radiusKm
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // No tags sent — server auto-extracts them from tipText
      const data = await createTip({ place: placeId, tipText });
      setTipText('');
      setPreviewKeywords([]);
      onSubmitted?.(data.tip);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimError('');
    if (!placeCoords) {
      setClaimError("This place's location isn't available yet.");
      return;
    }
    setClaiming(true);
    try {
      await addLocalArea({
        label: claimLabel || 'My local area',
        coordinates: placeCoords,
        radiusKm: claimRadius,
      });
      await refreshUser();
      setClaimed(true);
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (verifiedAreaHere) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-pink-200 bg-pink-50/40 p-4"
      >
        <h4 className="text-sm font-semibold text-gray-800">Share a local tip</h4>
        {error && <Alert variant="error">{error}</Alert>}
        <textarea
          value={tipText}
          onChange={(e) => setTipText(e.target.value)}
          placeholder='e.g. "Bennes has the best dosas — ask for the ghee roast"'
          rows={2}
          maxLength={255}
          required
          className="rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
        />

        {/* Live keyword preview — shown as soon as meaningful words appear */}
        {previewKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-gray-400 self-center">Auto keywords:</span>
            {previewKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-trippal-600"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        <Button type="submit" loading={loading} className="self-start">
          Post tip
        </Button>
      </form>
    );
  }

  if (pendingAreaHere || claimed) {
    return (
      <Alert variant="info">
        You've claimed local status near here — it's awaiting admin verification before you can post tips at this place.
      </Alert>
    );
  }

  return (
    <form
      onSubmit={handleClaim}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <h4 className="text-sm font-semibold text-gray-800">Only locals can leave tips here</h4>
      <p className="text-xs text-gray-500">
        Tips are reserved for people who actually know this area. If you're local around here,
        claim it below — an admin will verify it before your tips go live.
      </p>
      {claimError && <Alert variant="error">{claimError}</Alert>}
      <input
        value={claimLabel}
        onChange={(e) => setClaimLabel(e.target.value)}
        placeholder='Label this area (e.g. "My neighborhood")'
        maxLength={100}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Radius around this place:</label>
        <select
          value={claimRadius}
          onChange={(e) => setClaimRadius(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
        >
          {RADIUS_OPTIONS.map((km) => (
            <option key={km} value={km}>
              {km} km
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" loading={claiming} variant="secondary" className="self-start">
        I'm local around here
      </Button>
    </form>
  );
};

export default TipForm;