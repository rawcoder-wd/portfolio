export interface Settings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  contact_email: string;
  github_url: string;
  linkedin_url: string;
  cv_filename: string;
  calcom_username: string;
  calcom_event_slug: string;
  calcom_enabled: boolean;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: number; // 1-100
  learning_story: string;
  display_order: number;
}

export interface Project {
  id: number;
  title: string;
  summary: string;
  description: string;
  tech_stack: string[];
  image_url: string;
  live_url: string;
  repo_url: string;
  price_note: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface PortfolioData {
  settings: Settings;
  skills: Skill[];
  projects: Project[];
}

export interface InquiryRequest {
  type: 'contact' | 'purchase_request';
  project_id?: number;
  project_title?: string;
  sender_name: string;
  sender_email: string;
  budget_or_subject?: string;
  message: string;
}

export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  token: string;
}
