import { useState } from 'react';
import { Home, BarChart3, AlertTriangle, Users, LogIn, LogOut, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { CitizenDashboard } from './components/CitizenDashboard';
import { GovernmentDashboard } from './components/GovernmentDashboard';
import { ReportingTool } from './components/ReportingTool';
import { CollaborativeWorkspace } from './components/CollaborativeWorkspace';

type Page = 'citizen' | 'government' | 'reporting' | 'workspace';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('citizen');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setCurrentPage('citizen');
    setMobileMenuOpen(false);
  };

  const navigation = [
    { id: 'citizen', name: 'Projets', icon: Home, public: true },
    { id: 'government', name: 'Tableau de bord', icon: BarChart3, roles: ['government', 'partner'] },
    { id: 'reporting', name: 'Signalement', icon: AlertTriangle, public: true },
    { id: 'workspace', name: 'Collaboration', icon: Users, roles: ['government', 'partner'] },
  ];

  const canAccessPage = (page: typeof navigation[0]) => {
    if (page.public) return true;
    if (!user || !profile) return false;
    return page.roles?.includes(profile.role);
  };

  const filteredNavigation = navigation.filter(canAccessPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-lg font-bold text-gray-900">SISAG</h1>
                  <p className="text-xs text-gray-600">Suivi Action Gouvernementale</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user && profile ? (
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                    <p className="text-xs text-gray-600">
                      {profile.role === 'citizen' ? 'Citoyen' :
                       profile.role === 'government' ? 'Gouvernement' : 'Partenaire'}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Connexion
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id as Page);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}

              <div className="pt-3 border-t border-gray-200">
                {user && profile ? (
                  <>
                    <div className="px-4 py-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                      <p className="text-xs text-gray-600">
                        {profile.role === 'citizen' ? 'Citoyen' :
                         profile.role === 'government' ? 'Gouvernement' : 'Partenaire'}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    Connexion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {currentPage === 'citizen' && <CitizenDashboard />}
        {currentPage === 'government' && <GovernmentDashboard />}
        {currentPage === 'reporting' && <ReportingTool />}
        {currentPage === 'workspace' && <CollaborativeWorkspace />}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">SISAG</h3>
              <p className="text-sm text-gray-600">
                Système d'Intégration et de Suivi de l'Action Gouvernementale pour la République
                Démocratique du Congo
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
              <p className="text-sm text-gray-600">
                Email: contact@sisag.cd<br />
                Tél: +243 XXX XXX XXX
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
              <p className="text-sm text-gray-600">
                Hackathon SISAG 2024<br />
                Transparence et participation citoyenne
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              2024 SISAG. Tous droits réservés. République Démocratique du Congo
            </p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
