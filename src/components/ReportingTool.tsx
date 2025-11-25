import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Send, CheckCircle, XCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { STRINGS } from '../lib/strings';
import type { Database } from '../lib/database.types';
import { getProjects, getReports, createReport } from '../lib/api';

type Project = Database['public']['Tables']['projects']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
// Removed unused ReportInsert type alias to fix linter warning.

const CATEGORIES = [
  { value: 'delay', label: 'Retard dans l\'exécution', icon: '⏱️' },
  { value: 'quality', label: 'Problème de qualité', icon: '⚠️' },
  { value: 'corruption', label: 'Soupçon de corruption', icon: '🚫' },
  { value: 'other', label: 'Autre problème', icon: '📋' }
];

export function ReportingTool() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    category: 'other' as 'delay' | 'quality' | 'corruption' | 'other',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    loadProjects();
    if (user) {
      loadMyReports();
    }
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get('reportProjectId');
    if (pid) {
      setFormData((prev) => ({ ...prev, project_id: pid }));
      setShowForm(true);
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadMyReports = async () => {
    if (!user) return;

    try {
      const data = await getReports({ mine: true });
      setMyReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        project_id: formData.project_id || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      await createReport(payload);

      setSuccess(true);
      setFormData({
        project_id: '',
        title: '',
        description: '',
        category: 'other',
        latitude: null,
        longitude: null,
      });
      loadMyReports();

      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Erreur lors de l\'envoi du signalement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-rdcYellowLight text-rdcYellow border-rdcYellowLight';
      case 'in_review':
        return 'bg-rdcBlueLight text-rdcBlue border-rdcBlueLight';
      case 'resolved':
        return 'bg-rdcGreenLight text-rdcGreen border-rdcGreenLight';
      case 'rejected':
        return 'bg-rdcRedLight text-rdcRed border-rdcRedLight';
      default:
        return 'bg-rdcGrayBg text-rdcGrayText border-rdcGrayBorder';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_review':
        return 'En cours d\'examen';
      case 'resolved':
        return 'Résolu';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <>
    <div className="min-h-screen bg-rdcGrayBg">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Signalement Citoyen</h1>
              <p className="text-white/80 mt-1">Signalez les problèmes et anomalies sur les projets gouvernementaux</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!user ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-rdcGrayText mb-6">Vous devez être connecté pour soumettre un signalement</p>
          </div>
        ) : (
          <>
            {!showForm ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Comment signaler un problème ?
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-red-600">1.</span>
                      Identifiez le projet concerné ou décrivez la localisation
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-red-600">2.</span>
                      Choisissez la catégorie du problème
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-red-600">3.</span>
                      Décrivez précisément le problème observé
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-red-600">4.</span>
                      Ajoutez des photos si possible (à venir)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 w-full btn-danger flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Nouveau signalement
                  </button>
                </div>

                {myReports.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Mes signalements
                    </h2>
                    <div className="space-y-4">
                      {myReports.map((report) => {
                        const pr = projects.find(p => p.id === (report.project_id || '')) || null;
                        return (
                          <div
                            key={report.id}
                            className={`border rounded-lg p-4 ${getStatusColor(report.status)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-rdcTextPrimary">{report.title}</h3>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60">{getStatusLabel(report.status)}</span>
                            </div>
                            {pr && (
                              <button
                                type="button"
                                className="text-xs text-rdcTextPrimary mb-2 underline underline-offset-2 hover:text-blue-600"
                                onClick={() => setSelectedProject(pr)}
                                title="Voir le détail du projet"
                              >
                                Projet: <span className="font-bold">{pr.title}</span> — {pr.province} — {pr.sector}
                              </button>
                            )}
                            <p className="text-sm text-rdcGrayText mb-2">{report.description}</p>
                            <div className="flex items-center gap-4 text-xs text-rdcGrayText">
                              <span>
                                Catégorie:{' '}
                                {CATEGORIES.find((c) => c.value === report.category)?.label}
                              </span>
                              <span>
                                {new Date(report.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {report.resolution_notes && (
                              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                                <p className="text-xs font-medium mb-1">Réponse:</p>
                                <p className="text-sm">{report.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {success ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Signalement envoyé !
                    </h2>
                    <p className="text-gray-600">
                      Votre signalement a été transmis aux autorités compétentes.
                      Vous serez notifié de son traitement.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Nouveau signalement
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Projet concerné (optionnel)
                        </label>
                        <select
                          value={formData.project_id}
                          onChange={(e) =>
                            setFormData({ ...formData, project_id: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un projet...</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.title} - {project.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catégorie
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {CATEGORIES.map((category) => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, category: category.value as any })
                              }
                              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                                formData.category === category.value
                                  ? 'border-red-600 bg-red-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-2xl mb-1 block">{category.icon}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {category.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre du signalement
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Ex: Travaux non conformes sur le tronçon..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description détaillée
                        </label>
                        <textarea
                          required
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          rows={5}
                          placeholder="Décrivez précisément le problème observé, la localisation exacte, et tout élément pertinent..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <MapPin className="w-4 h-4" />
                          {formData.latitude
                            ? `Position enregistrée (${formData.latitude.toFixed(6)}, ${formData.longitude?.toFixed(6)})`
                            : 'Ajouter ma position actuelle'}
                        </button>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Envoyer le signalement
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
    </div>
  </div>
  {selectedProject && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProject(null)}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
              <div className="text-sm text-gray-700">{selectedProject.city}, {selectedProject.province} • {selectedProject.sector}</div>
              <div className="mt-1 text-xs text-gray-600">Statut: {STRINGS.projectStatusLabels[selectedProject.status]}</div>
            </div>
            <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget alloué</h3>
              <p className="text-gray-700 text-lg">{formatCurrency(Number(selectedProject.budget || 0))}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
              <p className="text-gray-700 text-lg">{formatCurrency(Number(selectedProject.spent || 0))}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Date de début</h3>
              <p className="text-gray-700">{new Date(selectedProject.start_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Date de fin prévue</h3>
              <p className="text-gray-700">{new Date(selectedProject.end_date).toLocaleDateString('fr-FR')}</p>
            </div>
            {selectedProject.actual_end_date && (
              <div className="col-span-2">
                <h3 className="font-semibold text-gray-900 mb-2">Date de fin réelle</h3>
                <p className="text-gray-700">{new Date(selectedProject.actual_end_date).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{selectedProject.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                <p className="text-gray-700">{selectedProject.city}, {selectedProject.province}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                <p className="text-gray-700">{selectedProject.sector}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ministère</h3>
                <p className="text-gray-700">{selectedProject.ministry}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Responsable</h3>
                <p className="text-gray-700">{selectedProject.responsible_person}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
  </>
  );
}
