import { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, MapPinned } from 'lucide-react';
import { getPendingLocalAreas, verifyLocalArea, rejectLocalArea } from '../../api/adminApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const LocalVerificationPanel = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getPendingLocalAreas()
      .then((d) => setAreas(d.areas))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleVerify = async (userId, areaId) => {
    setError('');
    try {
      await verifyLocalArea(userId, areaId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (userId, areaId) => {
    setError('');
    try {
      await rejectLocalArea(userId, areaId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-400">
        Users claim local status for specific areas, not their whole account — review each claim
        before it unlocks tip posting inside that radius.
      </p>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ) : areas.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No local area claims awaiting verification.</p>
        ) : (
          areas.map((area) => (
            <div
              key={area.areaId}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3.5"
            >
              <div className="flex items-start gap-2">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{area.label}</p>
                  <p className="text-xs text-gray-500">
                    {area.userName} ({area.userEmail})
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">Claim Details:</span> {area.radiusKm}km radius centered at {area.coordinates?.[1]?.toFixed(4)}, {area.coordinates?.[0]?.toFixed(4)}
                    {area.coordinates && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${area.coordinates[1]},${area.coordinates[0]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1.5 text-trippal-600 hover:underline font-medium"
                      >
                        (View on map)
                      </a>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Requested {new Date(area.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  variant="primary"
                  className="px-2.5! py-1.5!"
                  onClick={() => handleVerify(area.userId, area.areaId)}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="danger"
                  className="px-2.5! py-1.5!"
                  onClick={() => handleReject(area.userId, area.areaId)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LocalVerificationPanel;