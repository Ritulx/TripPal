import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import Button from './ui/Button';
import { updatePreferences } from '../api/authApi';

const PreferencesEditor = ({ initialPreferences, onSaved }) => {
  const [preferences, setPreferences] = useState(initialPreferences || []);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addPreference = () => {
    const val = input.trim();
    if (!val || preferences.includes(val)) return;
    setPreferences([...preferences, val]);
    setInput('');
  };

  const removePreference = (p) => setPreferences(preferences.filter((x) => x !== p));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updatePreferences(preferences);
      onSaved?.(data.user);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-800">Your preferences</h3>
      <p className="mt-0.5 text-xs text-gray-400">
        Things you care about — used to personalize future searches.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {preferences.map((p) => (
          <span
            key={p}
            className="flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-trippal-700"
          >
            {p}
            <button onClick={() => removePreference(p)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {preferences.length === 0 && (
          <p className="text-xs text-gray-400">No preferences added yet.</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addPreference();
            }
          }}
          placeholder="e.g. seafood, fresh flowers, vegan"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trippal-500"
        />
        <Button variant="secondary" onClick={addPreference} className="px-3!">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button onClick={handleSave} loading={saving} className="mt-3 w-full">
        Save preferences
      </Button>
    </div>
  );
};

export default PreferencesEditor;