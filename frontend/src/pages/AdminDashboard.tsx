import React, { useState, useEffect } from 'react';
import {
  fetchPortfolioData,
  adminUpdateSettings,
  adminUploadCV,
  adminConfigureCalcom,
  adminGetInquiries,
  adminMarkInquiryRead,
  adminDeleteInquiry,
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
  adminCreateSkill,
  adminUpdateSkill,
  adminDeleteSkill,
  adminUploadImage,
} from '../api/client';
import type { Settings, Project, Skill } from '../types';
import { getTechStackArray } from '../types';
import {
  User,
  Calendar,
  Inbox,
  LogOut,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Mail,
  ExternalLink,
  Shield,
  FileText,
  Check,
  Plus,
  Edit,
  X,
  FolderGit2,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'calcom' | 'inquiries' | 'projects' | 'skills'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for Settings
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    hero_title: '',
    hero_subtitle: '',
    about_text: '',
    contact_email: '',
    github_url: '',
    linkedin_url: '',
    cv_filename: '',
    calcom_username: '',
    calcom_event_slug: '',
    calcom_enabled: false,
  });

  // Projects & Skills state
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Project Modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    summary: '',
    description: '',
    tech_stack_str: '',
    image_url: '',
    live_url: '',
    repo_url: '',
    price_note: '',
    is_available: true,
    display_order: 0,
  });
  const [uploadingProjImg, setUploadingProjImg] = useState(false);

  // Skill Modal state
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'Frontend',
    proficiency: 80,
    learning_story: '',
    display_order: 0,
  });

  // CV Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Cal.com specific state
  const [calApiKey, setCalApiKey] = useState('');
  const [calUsername, setCalUsername] = useState('');
  const [calEventSlug, setCalEventSlug] = useState('');
  const [calEnabled, setCalEnabled] = useState(false);
  const [savingCal, setSavingCal] = useState(false);

  // Inquiries state
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'contact' | 'purchase_request'>('all');
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPortfolioData();
      if (data.settings) {
        setSettings(data.settings);
        setCalUsername(data.settings.calcom_username || '');
        setCalEventSlug(data.settings.calcom_event_slug || '');
        setCalEnabled(data.settings.calcom_enabled || false);
      }
      if (data.projects) setProjects(data.projects);
      if (data.skills) setSkills(data.skills);
      await loadInquiriesData();
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        onLogout();
      } else {
        setMessage({ type: 'error', text: 'Failed to load dashboard data.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInquiriesData = async () => {
    setLoadingInquiries(true);
    try {
      const list = await adminGetInquiries();
      setInquiries(list || []);
    } catch (err) {
      console.error('Failed to load inquiries', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Project CRUD handlers
  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      summary: '',
      description: '',
      tech_stack_str: '',
      image_url: '',
      live_url: '',
      repo_url: '',
      price_note: '',
      is_available: true,
      display_order: projects.length + 1,
    });
    setProjectModalOpen(true);
  };

  const openEditProjectModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectForm({
      title: proj.title,
      summary: proj.summary,
      description: proj.description,
      tech_stack_str: getTechStackArray(proj.tech_stack).join(', '),
      image_url: proj.image_url,
      live_url: proj.live_url,
      repo_url: proj.repo_url,
      price_note: proj.price_note || '',
      is_available: proj.is_available,
      display_order: proj.display_order,
    });
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const tech_stack = projectForm.tech_stack_str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: projectForm.title,
        summary: projectForm.summary,
        description: projectForm.description,
        tech_stack,
        image_url: projectForm.image_url,
        live_url: projectForm.live_url,
        repo_url: projectForm.repo_url,
        price_note: projectForm.price_note,
        is_available: projectForm.is_available,
        display_order: Number(projectForm.display_order),
      };

      if (editingProject) {
        const updated = await adminUpdateProject(editingProject.id, payload);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setMessage({ type: 'success', text: 'Project updated successfully!' });
      } else {
        const created = await adminCreateProject(payload);
        setProjects((prev) => [...prev, created]);
        setMessage({ type: 'success', text: 'Project created successfully!' });
      }
      setProjectModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save project' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await adminDeleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: 'success', text: 'Project deleted successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete project' });
    }
  };

  const handleUploadProjectThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProjImg(true);
    try {
      const res = await adminUploadImage(file);
      setProjectForm((prev) => ({ ...prev, image_url: res.url }));
      setMessage({ type: 'success', text: 'Thumbnail uploaded successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload image' });
    } finally {
      setUploadingProjImg(false);
    }
  };

  // Skill CRUD handlers
  const openCreateSkillModal = () => {
    setEditingSkill(null);
    setSkillForm({
      name: '',
      category: 'Frontend',
      proficiency: 85,
      learning_story: '',
      display_order: skills.length + 1,
    });
    setSkillModalOpen(true);
  };

  const openEditSkillModal = (sk: Skill) => {
    setEditingSkill(sk);
    setSkillForm({
      name: sk.name,
      category: sk.category,
      proficiency: sk.proficiency,
      learning_story: sk.learning_story || '',
      display_order: sk.display_order,
    });
    setSkillModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: skillForm.name,
        category: skillForm.category,
        proficiency: Number(skillForm.proficiency),
        learning_story: skillForm.learning_story,
        display_order: Number(skillForm.display_order),
      };

      if (editingSkill) {
        const updated = await adminUpdateSkill(editingSkill.id, payload);
        setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setMessage({ type: 'success', text: 'Skill updated successfully!' });
      } else {
        const created = await adminCreateSkill(payload);
        setSkills((prev) => [...prev, created]);
        setMessage({ type: 'success', text: 'Skill created successfully!' });
      }
      setSkillModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save skill' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await adminDeleteSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setMessage({ type: 'success', text: 'Skill deleted successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete skill' });
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await adminUpdateSettings(settings);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Profile & settings updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  // Handle CV Upload
  const handleCVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;
    setUploadingCV(true);
    setMessage(null);
    try {
      const res = await adminUploadCV(cvFile);
      setSettings((prev) => ({ ...prev, cv_filename: res.filename }));
      setCvFile(null);
      setMessage({ type: 'success', text: 'CV uploaded successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload CV' });
    } finally {
      setUploadingCV(false);
    }
  };

  // Handle Cal.com Config Save
  const handleSaveCalcom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCal(true);
    setMessage(null);
    try {
      const res = await adminConfigureCalcom({
        calcom_api_key: calApiKey.trim() ? calApiKey.trim() : undefined,
        calcom_username: calUsername.trim(),
        calcom_event_slug: calEventSlug.trim(),
        calcom_enabled: calEnabled,
      });
      setCalApiKey(''); // clear secret field after save
      setMessage({ type: 'success', text: res.message || 'Cal.com configuration saved successfully!' });
      // reload settings
      const data = await fetchPortfolioData();
      if (data.settings) setSettings(data.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save Cal.com config' });
    } finally {
      setSavingCal(false);
    }
  };

  // Handle Inquiry Actions
  const handleToggleRead = async (id: number, currentRead: boolean) => {
    try {
      if (!currentRead) {
        await adminMarkInquiryRead(id);
      }
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await adminDeleteInquiry(id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Failed to delete inquiry');
    }
  };

  const filteredInquiries = inquiries.filter((item) => {
    if (inquiryFilter === 'all') return true;
    return item.type === inquiryFilter;
  });

  const unreadCount = inquiries.filter((i) => !i.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-lg font-medium">Loading control panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center">
                Super-User Control Panel
                <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-slate-400">Manage portfolio content, settings & consultation leads</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Site
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center space-x-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-b border-slate-800 mb-8 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-t-xl font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & CV Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('calcom')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-t-xl font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'calcom'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Cal.com Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-t-xl font-medium text-sm transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'inquiries'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inquiries Inbox</span>
            {unreadCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-cyan-500 text-slate-950 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-t-xl font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <span>Projects Showcase</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-t-xl font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'skills'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <span>Skills & Expertise</span>
          </button>
        </div>

        {/* Tab 1: Profile & CV Upload */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fadeIn">
            {/* CV Upload Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <FileText className="w-5 h-5 text-cyan-400 mr-2" />
                    Curriculum Vitae (CV) Management
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload your professional CV in PDF format. Visitors can download it instantly from the portfolio header and about section.
                  </p>
                </div>
                {settings.cv_filename && (
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-medium">
                    Current: {settings.cv_filename}
                  </span>
                )}
              </div>

              <form onSubmit={handleCVUpload} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full flex-grow">
                  <label className="block w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files && setCvFile(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-6 h-6 text-cyan-400" />
                      <span className="text-sm font-medium text-slate-300">
                        {cvFile ? cvFile.name : 'Choose PDF file or drag & drop here'}
                      </span>
                      <span className="text-xs text-slate-500">Maximum size 10MB (.pdf only)</span>
                    </div>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!cvFile || uploadingCV}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap shadow-lg shadow-cyan-500/10"
                >
                  {uploadingCV ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CV
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Hero & About Settings Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <User className="w-5 h-5 text-cyan-400 mr-2" />
                Hero, Bio & Social Links
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Customize the main headlines, introductory biography, and contact links displayed across the portfolio.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Hero Main Title</label>
                    <input
                      type="text"
                      value={settings.hero_title || ''}
                      onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      placeholder="e.g. Full-Stack Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      placeholder="e.g. developer@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={settings.hero_subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                    placeholder="Short elevator pitch or tagline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">About Section Text</label>
                  <textarea
                    rows={5}
                    value={settings.about_text || ''}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                    placeholder="Detailed professional background and philosophy"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">GitHub URL</label>
                    <input
                      type="url"
                      value={settings.github_url || ''}
                      onChange={(e) => setSettings({ ...settings, github_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      value={settings.linkedin_url || ''}
                      onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Cal.com Integration */}
        {activeTab === 'calcom' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto animate-fadeIn">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Cal.com Consultation Integration</h3>
                <p className="text-sm text-slate-400">
                  Connect your Cal.com account to embed the interactive booking widget directly onto your public portfolio.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCalcom} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <label className="font-medium text-white block text-sm">Enable Cal.com Booking Widget</label>
                  <p className="text-xs text-slate-400">Show or hide the consultation booking section on the public site</p>
                </div>
                <input
                  type="checkbox"
                  checked={calEnabled}
                  onChange={(e) => setCalEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cal.com API Key (Secret)</label>
                <input
                  type="password"
                  value={calApiKey}
                  onChange={(e) => setCalApiKey(e.target.value)}
                  placeholder="cal_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave blank to keep your existing saved API key securely in the database.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Cal.com Username</label>
                  <input
                    type="text"
                    required={calEnabled}
                    value={calUsername}
                    onChange={(e) => setCalUsername(e.target.value)}
                    placeholder="e.g. john-doe"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Slug</label>
                  <input
                    type="text"
                    required={calEnabled}
                    value={calEventSlug}
                    onChange={(e) => setCalEventSlug(e.target.value)}
                    placeholder="e.g. 30min or consultation"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-xs text-cyan-300/80 leading-relaxed">
                <strong>How it works:</strong> The backend verifies your API key via Cal.com API on save and stores credentials securely. Only your public username and event slug are exposed to the public frontend for embedding.
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingCal}
                  className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {savingCal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying & Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Cal.com Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Inquiries Inbox */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Inbox className="w-5 h-5 text-cyan-400 mr-2" />
                  Inquiries & Purchase Requests Inbox
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Unified inbox capturing visitor contact messages and project purchase/licensing offers.
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setInquiryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inquiryFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({inquiries.length})
                </button>
                <button
                  onClick={() => setInquiryFilter('purchase_request')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inquiryFilter === 'purchase_request'
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Purchase Requests ({inquiries.filter((i) => i.type === 'purchase_request').length})
                </button>
                <button
                  onClick={() => setInquiryFilter('contact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inquiryFilter === 'contact'
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Contact Messages ({inquiries.filter((i) => i.type === 'contact').length})
                </button>
              </div>
            </div>

            {loadingInquiries ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-medium text-slate-300">No inquiries found</h4>
                <p className="text-sm text-slate-500 mt-1">
                  When visitors submit contact or purchase requests, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInquiries.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-slate-900 border rounded-2xl p-6 transition-all ${
                      !item.is_read ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/5 bg-slate-900/90' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                            item.type === 'purchase_request'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {item.type === 'purchase_request' ? 'Purchase Request' : 'Contact Message'}
                        </span>
                        {!item.is_read && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full animate-pulse">
                            Unread
                          </span>
                        )}
                        {item.project_title && (
                          <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-lg">
                            Project: {item.project_title}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-xs">Sender Name</span>
                        <span className="font-semibold text-white">{item.sender_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">Sender Email</span>
                        <a
                          href={`mailto:${item.sender_email}`}
                          className="font-semibold text-cyan-400 hover:underline inline-flex items-center"
                        >
                          {item.sender_email}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      {item.budget_or_subject && (
                        <div className="md:col-span-2">
                          <span className="text-slate-500 block text-xs">
                            {item.type === 'purchase_request' ? 'Budget / Offer Note' : 'Subject'}
                          </span>
                          <span className="font-medium text-slate-200">{item.budget_or_subject}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <span className="text-slate-500 block text-xs mb-1">Message</span>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
                        {item.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
                      {!item.is_read && (
                        <button
                          onClick={() => handleToggleRead(item.id, item.is_read)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Mark as Read
                        </button>
                      )}
                      <a
                        href={`mailto:${item.sender_email}?subject=Re: Portfolio Inquiry`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        Reply via Email
                      </a>
                      <button
                        onClick={() => handleDeleteInquiry(item.id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Projects Manager */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FolderGit2 className="w-5 h-5 text-cyan-400 mr-2" />
                  Projects Manager
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Create, edit, delete portfolio projects, upload thumbnail images, manage tech stack tags, price notes, and availability toggles.
                </p>
              </div>
              <button
                onClick={openCreateProjectModal}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors text-sm shadow-lg shadow-cyan-500/10 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="h-48 bg-slate-950 relative overflow-hidden border-b border-slate-800">
                      {proj.image_url ? (
                        <img
                          src={proj.image_url}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <FolderGit2 className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider backdrop-blur-md ${
                            proj.is_available
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {proj.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <h4 className="text-lg font-bold text-white">{proj.title}</h4>
                        {proj.price_note && (
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                            <DollarSign className="w-3 h-3 mr-0.5" />
                            {proj.price_note}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-300 line-clamp-2">{proj.summary}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {getTechStackArray(proj.tech_stack).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs font-medium bg-slate-950 text-cyan-400 border border-slate-800 rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-800/80 mt-4">
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      {proj.live_url && (
                        <a
                          href={proj.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 inline-flex items-center"
                        >
                          Live <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {proj.repo_url && (
                        <a
                          href={proj.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 inline-flex items-center"
                        >
                          Repo <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditProjectModal(proj)}
                        className="p-2 rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                        title="Edit Project"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Skills Manager */}
        {activeTab === 'skills' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 mr-2" />
                  Skills & Expertise Manager
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Create, edit, and delete technical skills with category classification, proficiency level, and your unique 'How I Learned It' story.
                </p>
              </div>
              <button
                onClick={openCreateSkillModal}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors text-sm shadow-lg shadow-cyan-500/10 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Skill
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((sk) => (
                <div
                  key={sk.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                        {sk.category}
                      </span>
                      <span className="text-xs font-bold text-slate-300">{sk.proficiency}%</span>
                    </div>

                    <h4 className="text-lg font-bold text-white">{sk.name}</h4>

                    {/* Proficiency bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${sk.proficiency}%` }}
                      ></div>
                    </div>

                    {sk.learning_story && (
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 mt-3">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          How I Learned It
                        </span>
                        <p className="text-xs text-slate-300 line-clamp-3">{sk.learning_story}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => openEditSkillModal(sk)}
                      className="p-2 rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                      title="Edit Skill"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(sk.id)}
                      className="p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 sm:p-8 my-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingProject ? 'Edit Portfolio Project' : 'Create New Portfolio Project'}
              </h3>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={projectForm.display_order}
                    onChange={(e) => setProjectForm({ ...projectForm, display_order: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Summary (Short Card Text)</label>
                <input
                  type="text"
                  value={projectForm.summary}
                  onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Description / Details</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tech Stack <span className="text-slate-500">(comma separated, e.g. React, TypeScript, Tailwind)</span>
                </label>
                <input
                  type="text"
                  value={projectForm.tech_stack_str}
                  onChange={(e) => setProjectForm({ ...projectForm, tech_stack_str: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Thumbnail Image URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectForm.image_url}
                    onChange={(e) => setProjectForm({ ...projectForm, image_url: e.target.value })}
                    placeholder="/uploads/thumbnail.png or https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <label className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap border border-slate-700">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploadingProjImg ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadProjectThumbnail}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectForm.live_url}
                    onChange={(e) => setProjectForm({ ...projectForm, live_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Code Repo URL</label>
                  <input
                    type="url"
                    value={projectForm.repo_url}
                    onChange={(e) => setProjectForm({ ...projectForm, repo_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price Note (e.g. "$499 / license")</label>
                  <input
                    type="text"
                    value={projectForm.price_note}
                    onChange={(e) => setProjectForm({ ...projectForm, price_note: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-5">
                  <input
                    type="checkbox"
                    id="proj_is_available"
                    checked={projectForm.is_available}
                    onChange={(e) => setProjectForm({ ...projectForm, is_available: e.target.checked })}
                    className="w-4 h-4 text-cyan-500 bg-slate-950 border-slate-700 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="proj_is_available" className="text-xs font-medium text-slate-200 cursor-pointer">
                    Available for Purchase / Inquiries
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {skillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 my-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingSkill ? 'Edit Technical Skill' : 'Create New Technical Skill'}
              </h3>
              <button
                onClick={() => setSkillModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Languages">Languages</option>
                    <option value="Tools & AI">Tools & AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={skillForm.display_order}
                    onChange={(e) => setSkillForm({ ...skillForm, display_order: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">Proficiency Level</label>
                  <span className="text-xs font-bold text-cyan-400">{skillForm.proficiency}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={skillForm.proficiency}
                  onChange={(e) => setSkillForm({ ...skillForm, proficiency: Number(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-950 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">'How I Learned It' Story</label>
                <textarea
                  rows={4}
                  value={skillForm.learning_story}
                  onChange={(e) => setSkillForm({ ...skillForm, learning_story: e.target.value })}
                  placeholder="Share the project, challenge, or breakthrough where you mastered this skill..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSkillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  {saving ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
