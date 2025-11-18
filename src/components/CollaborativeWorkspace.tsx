import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, Users, Plus, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { getEvents, getMessages, getProfiles, createEvent, createMessage } from '../lib/api';

type Event = Database['public']['Tables']['events']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function CollaborativeWorkspace() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'messages'>('calendar');
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  useEffect(() => {
    if (user && profile) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, messagesRes, profilesRes] = await Promise.all([
        getEvents(),
        getMessages(),
        getProfiles()
      ]);

      setEvents(eventsRes || []);
      setMessages(messagesRes || []);
      setProfiles(profilesRes || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createEvent({
        title: eventForm.title,
        description: eventForm.description,
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        location: eventForm.location,
        participants: [],
      } as any);

      setEventForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
      });
      setShowEventForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await createMessage({
        content: newMessage.trim(),
      } as any);

      setNewMessage('');
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return profile?.full_name || 'Utilisateur inconnu';
  };

  const getRoleBadge = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    if (!profile) return null;

    const roleColors = {
      citizen: 'bg-gray-100 text-gray-800',
      government: 'bg-blue-100 text-blue-800',
      partner: 'bg-green-100 text-green-800',
    };

    const roleLabels = {
      citizen: 'Citoyen',
      government: 'Gouvernement',
      partner: 'Partenaire',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[profile.role]}`}>
        {roleLabels[profile.role]}
      </span>
    );
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connexion requise</h2>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder à l'espace collaboratif
          </p>
        </div>
      </div>
    );
  }

  if (profile.role === 'citizen') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">
            L'espace collaboratif est réservé aux agents gouvernementaux et aux partenaires
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Espace Collaboratif</h1>
              <p className="text-green-100 mt-1">
                Coordination entre acteurs gouvernementaux et partenaires
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'calendar'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Calendrier partagé
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                Messagerie
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="p-6">
              {activeTab === 'calendar' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Événements à venir</h2>
                    {!showEventForm && (
                      <button
                        onClick={() => setShowEventForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Nouvel événement
                      </button>
                    )}
                  </div>

                  {showEventForm && (
                    <form
                      onSubmit={handleCreateEvent}
                      className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Créer un événement
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titre
                          </label>
                          <input
                            type="text"
                            required
                            value={eventForm.title}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, title: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Réunion de coordination..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            required
                            value={eventForm.description}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, description: e.target.value })
                            }
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Objectif de la réunion..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Début
                            </label>
                            <input
                              type="datetime-local"
                              required
                              value={eventForm.start_time}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, start_time: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fin
                            </label>
                            <input
                              type="datetime-local"
                              required
                              value={eventForm.end_time}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, end_time: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lieu
                          </label>
                          <input
                            type="text"
                            required
                            value={eventForm.location}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, location: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Adresse ou lien de visioconférence"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowEventForm(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                          >
                            Créer
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Aucun événement planifié</p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <span className="text-xs text-gray-500">
                              {getProfileName(event.organizer_id)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Début: </span>
                              <span className="text-gray-900">
                                {new Date(event.start_time).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fin: </span>
                              <span className="text-gray-900">
                                {new Date(event.end_time).toLocaleString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Lieu: </span>
                            <span className="text-gray-900">{event.location}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="flex flex-col h-[600px]">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Messagerie de groupe
                  </h2>

                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Aucun message</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-sm font-semibold ${
                                    isOwnMessage ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {getProfileName(message.sender_id)}
                                </span>
                                {!isOwnMessage && getRoleBadge(message.sender_id)}
                              </div>
                              <p
                                className={`text-sm ${
                                  isOwnMessage ? 'text-white' : 'text-gray-700'
                                }`}
                              >
                                {message.content}
                              </p>
                              <span
                                className={`text-xs mt-1 block ${
                                  isOwnMessage ? 'text-green-100' : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Envoyer
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
