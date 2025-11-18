import type { Database } from './database.types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) { authToken = token; if (token) localStorage.setItem('sisag_token', token); else localStorage.removeItem('sisag_token'); }
export function getAuthToken() { if (!authToken) authToken = localStorage.getItem('sisag_token'); return authToken; }
export function clearAuthToken() { setAuthToken(null); }

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(options.headers as any || {}) };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Auth
export async function signUp(payload: { email: string; password: string; full_name: string; role: 'citizen'|'government'|'partner'; organization?: string|null; province?: string|null; phone?: string|null; }) {
  const data = await request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
  setAuthToken(data.token);
  return data as { token: string; user: { id: string; email: string }; profile: Database['public']['Tables']['profiles']['Row'] };
}
export async function signIn(email: string, password: string) {
  const data = await request('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
  setAuthToken(data.token);
  return data as { token: string; user: { id: string; email: string }; profile: Database['public']['Tables']['profiles']['Row'] };
}
export async function me() { return request('/auth/me', { method: 'GET' }) as Promise<{ user: { id: string; email: string; created_at: string }; profile: Database['public']['Tables']['profiles']['Row'] }>; }

// Projects
type Project = Database['public']['Tables']['projects']['Row'];
export async function getProjects(filters?: { province?: string; sector?: string; status?: Project['status'] }) {
  const params = new URLSearchParams();
  if (filters?.province) params.set('province', filters.province);
  if (filters?.sector) params.set('sector', filters.sector);
  if (filters?.status) params.set('status', filters.status);
  return request(`/projects${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' }) as Promise<Project[]>;
}
export async function createProject(payload: Omit<Database['public']['Tables']['projects']['Insert'],'created_by'|'images'> & { images?: any[] }) {
  return request('/projects', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Project>;
}

// Alerts
type Alert = Database['public']['Tables']['alerts']['Row'];
export async function getAlerts() { return request('/alerts', { method: 'GET' }) as Promise<Alert[]>; }
export async function createAlert(payload: { project_id: string; type: Alert['type']; severity: Alert['severity']; message: string; }) { return request('/alerts', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Alert>; }

// Reports
type Report = Database['public']['Tables']['reports']['Row'];
export async function getReports(options?: { mine?: boolean }) {
  const params = new URLSearchParams();
  if (options?.mine) params.set('mine', 'true');
  return request(`/reports${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' }) as Promise<Report[]>;
}
export async function createReport(payload: Omit<Database['public']['Tables']['reports']['Insert'],'reporter_id'|'images'> & { images?: any[] }) { return request('/reports', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Report>; }

// Collaborative
type Profile = Database['public']['Tables']['profiles']['Row'];
export async function getProfiles() { return request('/profiles', { method: 'GET' }) as Promise<Profile[]>; }

type Event = Database['public']['Tables']['events']['Row'];
export async function getEvents() { return request('/events', { method: 'GET' }) as Promise<Event[]>; }
export async function createEvent(payload: Omit<Database['public']['Tables']['events']['Insert'],'organizer_id'|'participants'> & { participants?: any[] }) { return request('/events', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Event>; }

type Message = Database['public']['Tables']['messages']['Row'];
export async function getMessages() { return request('/messages', { method: 'GET' }) as Promise<Message[]>; }
export async function createMessage(payload: Omit<Database['public']['Tables']['messages']['Insert'],'sender_id'|'attachments'|'is_read'> & { attachments?: any[] }) { return request('/messages', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Message>; }