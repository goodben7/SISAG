import { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Building2, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

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

const STATUS_LABELS = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  delayed: 'En retard',
  cancelled: 'Annulé'
};

const STATUS_COLORS = {
  planned: 'bg-rdcGrayBg text-rdcGrayText',
  in_progress: 'bg-rdcBlueLight text-rdcBlue',
  completed: 'bg-rdcGreenLight text-rdcGreen',
  delayed: 'bg-rdcRedLight text-rdcRed',
  cancelled: 'bg-rdcGrayBorder text-white'
};

const STATUS_BORDER_COLORS: Record<Project['status'], string> = {
  planned: 'border-rdcGrayBorder',
  in_progress: 'border-rdcBlue',
  completed: 'border-rdcGreen',
  delayed: 'border-rdcRed',
  cancelled: 'border-rdcGrayBorder'
};

export function CitizenDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    province: '',
    sector: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      let query = supabase.from('projects').select('*');

      if (filters.province) {
        query = query.eq('province', filters.province);
      }
      if (filters.sector) {
        query = query.eq('sector', filters.sector);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (project: Project) => {
    if (project.budget === 0) return 0;
    return Math.min(100, (project.spent / project.budget) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="header-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">SISAG - Suivi de l'Action Gouvernementale</h1>
              <p className="text-blue-100 mt-1">Transparence et participation citoyenne</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet par nom, description ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-rdcTextPrimary focus:outline-none focus:ring-2 focus:ring-rdcBlue"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white text-rdcBlue rounded-lg font-medium hover:bg-rdcBlueLight transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  value={filters.province}
                  onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                  className="w-full px-3 py-2 border border-rdcGrayBorder rounded-lg text-rdcTextPrimary focus:ring-2 focus:ring-rdcBlue"
                >
                  <option value="">Toutes les provinces</option>
                  {PROVINCES.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-rdcGrayBorder rounded-lg text-rdcTextPrimary focus:ring-2 focus:ring-rdcBlue"
                >
                  <option value="">Tous les secteurs</option>
                  {SECTORS.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-rdcGrayBorder rounded-lg text-rdcTextPrimary focus:ring-2 focus:ring-rdcBlue"
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total projets</div>
            <div className="text-2xl font-bold text-gray-900">{filteredProjects.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">En cours</div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredProjects.filter(p => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Terminés</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredProjects.filter(p => p.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">En retard</div>
            <div className="text-2xl font-bold text-red-600">
              {filteredProjects.filter(p => p.status === 'delayed').length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Chargement des projets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-l-4 ${STATUS_BORDER_COLORS[project.status]}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {project.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${STATUS_COLORS[project.status]}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{project.city}, {project.province}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{project.sector}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(project.start_date).toLocaleDateString('fr-FR')} - {new Date(project.end_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Budget utilisé</span>
                      <span className="font-medium text-gray-900">
                        {calculateProgress(project).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-rdcYellow transition-all"
                        style={{ width: `${Math.min(100, calculateProgress(project))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{formatCurrency(project.spent)}</span>
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos filtres de recherche</p>
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <AlertTriangle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{project.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                <p className="text-gray-700">{project.city}, {project.province}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                <p className="text-gray-700">{project.sector}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ministère</h3>
                <p className="text-gray-700">{project.ministry}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Responsable</h3>
                <p className="text-gray-700">{project.responsible_person}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Budget alloué</h3>
                <p className="text-gray-700 text-lg">{formatCurrency(project.budget)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
                <p className="text-gray-700 text-lg">{formatCurrency(project.spent)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Date de début</h3>
                <p className="text-gray-700">{new Date(project.start_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Date de fin prévue</h3>
                <p className="text-gray-700">{new Date(project.end_date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Signaler un problème sur ce projet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
