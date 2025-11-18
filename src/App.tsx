import { useState } from 'react';
import { Home, BarChart3, AlertTriangle, Users, LogIn, LogOut, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { CitizenDashboard } from './components/CitizenDashboard';
import { GovernmentDashboard } from './components/GovernmentDashboard';
import { ReportingTool } from './components/ReportingTool';
import { CollaborativeWorkspace } from './components/CollaborativeWorkspace';
import { Footer } from './components/Footer';

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
      <header className="header-gradient sticky top-0 z-40 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-rdcBlue to-rdcBlueDark ring-2 ring-rdcYellow">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-lg font-bold">SISAG – Suivi de l'Action Gouvernementale</h1>
                  <p className="text-xs text-white/80">Transparence et participation citoyenne</p>
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
                    className={`nav-button ${
                      currentPage === item.id ? 'nav-active' : 'nav-inactive'
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

      <Footer />

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
