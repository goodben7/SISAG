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
export async function updateProject(projectId: string, payload: Partial<Database['public']['Tables']['projects']['Update']>) {
  return request(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(payload) }) as Promise<Project>;
}
export type ProjectAction = { id: string; project_id: string; user_id: string; action_type: 'status_update'|'budget_update'|'field_update'; details: any; created_at: string };
export async function getProjectActions(projectId: string) { return request(`/projects/${projectId}/actions`, { method: 'GET' }) as Promise<ProjectAction[]>; }

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

// Planning: Objectives, Phases, Alignment, Planning Alerts
export type Objective = { id: string; code: string; title: string; level: 'national'|'provincial'|'territorial'; sector: string; created_at: string };
export async function getObjectives() { return request('/objectives', { method: 'GET' }) as Promise<Objective[]>; }
export async function createObjective(payload: { code: string; title: string; level?: 'national'|'provincial'|'territorial'; sector: string; }) {
  return request('/objectives', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Objective>;
}

export type Phase = {
  id: string;
  project_id: string;
  name: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: 'planned'|'in_progress'|'completed'|'blocked';
  deliverables: any[];
  created_at: string;
  updated_at: string;
};
export async function getProjectPhases(projectId: string) {
  return request(`/projects/${projectId}/phases`, { method: 'GET' }) as Promise<Phase[]>;
}
export async function createPhase(projectId: string, payload: Omit<Phase,'id'|'project_id'|'created_at'|'updated_at'>) {
  return request(`/projects/${projectId}/phases`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<Phase>;
}
export async function getProjectObjectives(projectId: string) {
  return request(`/projects/${projectId}/objectives`, { method: 'GET' }) as Promise<AlignmentObjective[]>;
}
export async function linkProjectObjective(projectId: string, payload: { objective_id: string; weight: number }) {
  return request(`/projects/${projectId}/objectives`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ project_id: string; objective_id: string; weight: number }>;
}
export async function updateProjectObjectiveWeight(projectId: string, objectiveId: string, weight: number) {
  return request(`/projects/${projectId}/objectives`, { method: 'POST', body: JSON.stringify({ objective_id: objectiveId, weight }) }) as Promise<{ project_id: string; objective_id: string; weight: number }>;
}
export async function unlinkProjectObjective(projectId: string, objectiveId: string) {
  return request(`/projects/${projectId}/objectives/${objectiveId}`, { method: 'DELETE' }) as Promise<{ success: true }>;
}

export type AlignmentObjective = { id: string; code: string; title: string; level: 'national'|'provincial'|'territorial'; sector: string; weight: number };
export type AlignmentResult = { score: number; objectives: AlignmentObjective[]; redundancy: { similarProjects: number }; suggestions: { id: string; code: string; title: string; level: 'national'|'provincial'|'territorial'; sector: string }[] };
export async function getProjectAlignment(projectId: string) {
  return request(`/projects/${projectId}/alignment`, { method: 'GET' }) as Promise<AlignmentResult>;
}

export type PlanningAlert = { id: string; project_id: string; phase_id: string|null; type: 'delay'|'blocked'|'budget_drift'; severity: 'low'|'medium'|'high'|'critical'; message: string; created_at: string };
export async function getPlanningAlerts() { return request('/alerts/planning', { method: 'GET' }) as Promise<PlanningAlert[]>; }
export async function createPlanningAlert(payload: { project_id: string; phase_id?: string|null; type: PlanningAlert['type']; severity: PlanningAlert['severity']; message: string; }) {
  return request('/alerts/planning', { method: 'POST', body: JSON.stringify(payload) }) as Promise<PlanningAlert>;
}
export async function updatePhase(projectId: string, phaseId: string, payload: Partial<Omit<Phase,'id'|'project_id'|'created_at'|'updated_at'>>) {
  return request(`/projects/${projectId}/phases/${phaseId}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Phase>;
}
export async function deletePhase(projectId: string, phaseId: string) {
  return request(`/projects/${projectId}/phases/${phaseId}`, { method: 'DELETE' }) as Promise<{ success: true }>;
}

// Maturity Assessment
export type MaturityAssessment = {
  project_id: string;
  budget_available: number;
  disbursement_planned: number;
  funding_source_confirmed: number;
  contracts_signed: number;
  feasibility_study: number;
  technical_plans_validated: number;
  documentation_complete: number;
  governance_defined: number;
  steering_committee_formed: number;
  tenders_launched_awarded: number;
  project_team_available: number;
  logistics_ready: number;
  risks_identified: number;
  pag_alignment_percent: number;
  attachments: any[];
};
export type MaturityResult = {
  assessment: MaturityAssessment;
  score: number;
  dimensions: { financial: number; technical: number; legal: number; operational: number; strategic: number };
  recommendation: { status: 'ready'|'preparing'|'not_ready'; message: string };
};
export async function getProjectMaturity(projectId: string) {
  return request(`/projects/${projectId}/maturity`, { method: 'GET' }) as Promise<MaturityResult>;
}
export async function saveProjectMaturity(projectId: string, payload: Partial<MaturityAssessment>) {
  return request(`/projects/${projectId}/maturity`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<MaturityResult>;
}