import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getAllCategoriesAdmin, createCategory, updateCategory } from '../../api/adminApi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';

const CategoryManagerPanel = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getAllCategoriesAdmin()
      .then((d) => setCategories(d.categories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await createCategory(form);
      setForm({ name: '', description: '', icon: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (cat) => {
    setError('');
    try {
      await updateCategory(cat._id, { isActive: !cat.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3.5"
      >
        <div className="min-w-35 flex-1">
          <Input
            id="catName"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Pharmacies"
            required
          />
        </div>
        <div className="min-w-35 flex-1">
          <Input
            id="catIcon"
            label="Icon (lucide name)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Pill"
          />
        </div>
        <div className="min-w-50 flex-2">
          <Input
            id="catDesc"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Pharmacies and drug stores"
          />
        </div>
        <Button type="submit" loading={creating} className="px-3!">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          categories.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {cat.name} <span className="text-xs font-normal text-gray-400">/{cat.slug}</span>
                </p>
                <p className="text-xs text-gray-500">{cat.description}</p>
              </div>
              <button
                onClick={() => toggleActive(cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors
                  ${cat.isActive ? 'bg-pink-100 text-trippal-700' : 'bg-gray-100 text-gray-400'}`}
              >
                {cat.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManagerPanel;