import type { PortfolioData, InquiryRequest, AdminLoginRequest, AdminLoginResponse, Project, Skill, Settings } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchPortfolioData(): Promise<PortfolioData> {
  const res = await fetch(`${API_BASE}/portfolio-data`);
  if (!res.ok) throw new Error('Failed to fetch portfolio data');
  return res.json();
}

export async function submitInquiry(data: InquiryRequest): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit inquiry' }));
    throw new Error(err.error || 'Failed to submit inquiry');
  }
  return res.json();
}

export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid password' }));
    throw new Error(err.error || 'Invalid password');
  }
  return res.json();
}

// Admin API wrappers
export async function adminUpdateSettings(settings: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function adminCreateProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
  const res = await fetch(`${API_BASE}/admin/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function adminUpdateProject(id: number, project: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE}/admin/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function adminDeleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/projects/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function adminCreateSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
  const res = await fetch(`${API_BASE}/admin/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(skill),
  });
  if (!res.ok) throw new Error('Failed to create skill');
  return res.json();
}

export async function adminUpdateSkill(id: number, skill: Partial<Skill>): Promise<Skill> {
  const res = await fetch(`${API_BASE}/admin/skills/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(skill),
  });
  if (!res.ok) throw new Error('Failed to update skill');
  return res.json();
}

export async function adminDeleteSkill(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/skills/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete skill');
}

export async function adminGetInquiries(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/inquiries`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch inquiries');
  return res.json();
}

export async function adminMarkInquiryRead(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/inquiries/${id}/read`, {
    method: 'PATCH',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to update inquiry');
}

export async function adminDeleteInquiry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/inquiries/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete inquiry');
}

export async function adminConfigureCalcom(data: {
  calcom_api_key?: string;
  calcom_username: string;
  calcom_event_slug: string;
  calcom_enabled: boolean;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/calcom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to configure Cal.com' }));
    throw new Error(err.error || 'Failed to configure Cal.com');
  }
  return res.json();
}

export async function adminUploadCV(file: File): Promise<{ filename: string }> {
  const formData = new FormData();
  formData.append('cv', file);
  const res = await fetch(`${API_BASE}/admin/cv`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload CV');
  return res.json();
}

export async function adminUploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}
