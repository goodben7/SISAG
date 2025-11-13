import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { X, Save } from 'lucide-react';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const PROVINCES = [
  'Kinshasa', 'Kongo Central', 'Kwango', 'Kwilu', 'Mai-Ndombe',
  'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru',
  'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uélé', 'Tshopo',
  'Bas-Uélé', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi', 'Équateur',
  'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'
];

const SECTORS = [
  'Infrastructure', 'Éducation', 'Santé', 'Agriculture',
  'Eau et assainissement', 'Énergie', 'Transport', 'Autre'
];

const STATUSES: ProjectInsert['status'][] = ['planned','in_progress','completed','delayed','cancelled'];

export function AddProjectForm({ onClose, onCreated }: Props) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    sector: SECTORS[0],
    province: PROVINCES[0],
    city: '',
    ministry: '',
    responsible_person: '',
    budget: 0,
    status: 'planned' as ProjectInsert['status'],
    start_date: '',
    end_date: ''
  });

  const canCreate = !!profile && (profile.role === 'government' || profile.role === 'partner');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'budget' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !canCreate) {
      setError('Vous n\u2019avez pas les droits pour ajouter un projet.');
      return;
    }

    if (!form.title || !form.description || !form.city || !form.ministry || !form.responsible_person || !form.start_date || !form.end_date) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      const payload: ProjectInsert = {
        title: form.title,
        description: form.description,
        sector: form.sector,
        status: form.status,
        budget: form.budget || 0,
        spent: 0,
        province: form.province,
        city: form.city,
        start_date: form.start_date,
        end_date: form.end_date,
        ministry: form.ministry,
        responsible_person: form.responsible_person,
        images: [],
        created_by: user.id
      };

    const { error: insertError } = await (supabase.from('projects') as any).insert(payload);
      if (insertError) throw insertError;

      setSuccess('Projet ajout\u00e9 avec succ\u00e8s.');
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la cr\u00e9ation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Ajouter un projet</h2>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canCreate && (
          <div className="p-4 text-sm text-red-700 bg-red-50">
            Votre r\u00f4le ne permet pas d\u2019ajouter des projets.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre*</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" rows={4} required></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur*</label>
            <select name="sector" value={form.sector} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {SECTORS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province*</label>
            <select name="province" value={form.province} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville*</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minist\u00e8re*</label>
            <input name="ministry" value={form.ministry} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable*</label>
            <input name="responsible_person" value={form.responsible_person} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (CDF)</label>
            <input type="number" name="budget" value={form.budget} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" min={0} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de d\u00e9but*</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin*</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{success}</div>}

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Annuler</button>
            <button type="submit" disabled={loading || !canCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}