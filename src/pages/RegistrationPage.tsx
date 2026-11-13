import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { signInWithGooglePopup } from '../services/googleAuth';
import { ALL_THEMES } from '../themes';
import { SUPPORTED_LANGUAGES } from '../config/appConfig';
import type { AppCategory, ProgrammingLanguage } from '../types/project';
import type { ThemePreferenceOption } from '../types/registration';
import { Button } from '../components/common/Button';

const APP_TYPES: { id: AppCategory; label: string; detail: string }[] = [
  { id: 'HRMS', label: 'HRMS', detail: 'Employees, payroll ledger, leave & attendance workflows' },
  { id: 'E-Commerce', label: 'E-Commerce', detail: 'Catalog, storefront, cart, checkout & order management' },
  { id: 'Multi-Store Management', label: 'Multi-Store Management', detail: 'Branch warehouses, stock transfers & unified POS' },
  { id: 'SaaS Applications', label: 'SaaS Application', detail: 'Multi-tenant workspaces, RBAC & subscription billing' },
  { id: 'Healthcare Store Management', label: 'Healthcare Store', detail: 'Pharmacy inventory, batch expiry & prescription compliance' },
  { id: 'Custom Business Applications', label: 'Custom Business Application', detail: 'Tailored internal portals & operational pipelines' },
];

const THEME_OPTIONS: ThemePreferenceOption[] = [
  'Yes, use Aegion Glassmorphism themes',
  'Yes, use another Aegion theme',
  'I want to customize my theme',
  'I want the AI to design a custom UI',
  'I have an existing UI reference',
];

const MODULE_PRESETS = [
  'RBAC & Tenant Isolation',
  'Audit Logging',
  'Billing & Subscriptions',
  'Inventory & Warehousing',
  'Payroll & Attendance',
  'Analytics Dashboard',
  'Webhook Integrations',
  'Automated Notifications',
];

export const RegistrationPage: React.FC = () => {
  const {
    navigate,
    googlePrefill,
    setPendingStatusInfo,
    notify,
  } = useAegion();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [authProvider, setAuthProvider] = useState<'email' | 'google'>(googlePrefill ? 'google' : 'email');

  // Step 1: Personal Info
  const [fullName, setFullName] = useState(googlePrefill?.fullName || '');
  const [email, setEmail] = useState(googlePrefill?.email || '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Step 2: Project Requirements
  const [applicationTypes, setApplicationTypes] = useState<AppCategory[]>(['SaaS Applications']);

  // Step 3: Business Requirements
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [businessIndustry, setBusinessIndustry] = useState('Enterprise Technology');
  const [expectedUsers, setExpectedUsers] = useState('100 - 500');
  const [requiredModules, setRequiredModules] = useState<string[]>(['RBAC & Tenant Isolation', 'Analytics Dashboard']);
  const [preferredBackendLanguage, setPreferredBackendLanguage] = useState<ProgrammingLanguage>('Python');
  const [preferredFrontendFramework, setPreferredFrontendFramework] = useState('React + TypeScript');
  const [preferredDatabase, setPreferredDatabase] = useState('PostgreSQL');
  const [expectedComplexity, setExpectedComplexity] = useState<'Standard' | 'Moderate' | 'Enterprise Multi-Tenant'>('Moderate');
  const [preferredDeployment, setPreferredDeployment] = useState('Google Cloud Run / Docker');

  // Step 4: UI/UX Preferences
  const [themeOption, setThemeOption] = useState<ThemePreferenceOption>('Yes, use Aegion Glassmorphism themes');
  const [themeModePreference, setThemeModePreference] = useState<'light' | 'dark'>('dark');
  const [selectedThemeId, setSelectedThemeId] = useState('hrms-aurora-hr');
  const [customAccentColor, setCustomAccentColor] = useState('#7C3AED');
  const [typographyPreference, setTypographyPreference] = useState('Manrope + Plus Jakarta Sans');
  const [uiReferenceFileName, setUiReferenceFileName] = useState('');
  const [uiReferenceMimeType, setUiReferenceMimeType] = useState('');
  const [uiReferenceBase64, setUiReferenceBase64] = useState('');

  // Step 5: Additional Info
  const [projectDeadline, setProjectDeadline] = useState('');
  const [additionalFeatures, setAdditionalFeatures] = useState('');
  const [integrationRequirements, setIntegrationRequirements] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  // Step 6: Consent
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [consentRegistrationNotifications, setConsentRegistrationNotifications] = useState(true);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const toggleAppType = (cat: AppCategory) => {
    setApplicationTypes((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const toggleModule = (mod: string) => {
    setRequiredModules((prev) =>
      prev.includes(mod) ? prev.filter((item) => item !== mod) : [...prev, mod]
    );
  };

  const handleGooglePrefillClick = async () => {
    setErrorMessage(null);
    try {
      const res = await signInWithGooglePopup();
      setAuthProvider('google');
      if (res.email) setEmail(res.email);
      if (res.displayName) setFullName(res.displayName);
      notify('Prefilled verified Google profile', 'success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to connect Google account.');
    }
  };

  const handleUiReferenceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('UI reference file must be 5 MB or smaller.');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Only PNG, JPG, WEBP, or PDF files are accepted.');
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setUiReferenceFileName(file.name);
      setUiReferenceMimeType(file.type);
      setUiReferenceBase64(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = (): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !country.trim() || !companyName.trim() || !jobTitle.trim()) {
        setErrorMessage('Please complete all required personal and organization fields.');
        return false;
      }
    } else if (step === 2) {
      if (applicationTypes.length === 0) {
        setErrorMessage('Select at least one application type you plan to build.');
        return false;
      }
    } else if (step === 3) {
      if (!projectName.trim() || !projectDescription.trim()) {
        setErrorMessage('Project Name and Project Description are required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(6, s + 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptedTerms || !acceptedPrivacy || !consentRegistrationNotifications) {
      setErrorMessage('Please accept Terms of Service, Privacy Policy, and Registration Notifications consent.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.submitRegistration({
        authProvider,
        fullName,
        email,
        phone,
        country,
        companyName,
        companyWebsite,
        jobTitle,
        applicationTypes,
        projectName,
        projectDescription,
        businessIndustry,
        expectedUsers,
        requiredModules,
        preferredBackendLanguage,
        preferredFrontendFramework,
        preferredDatabase,
        expectedComplexity,
        preferredDeployment,
        themeOption,
        themeModePreference,
        selectedThemeId,
        customAccentColor,
        typographyPreference,
        uiReferenceFileName,
        uiReferenceMimeType,
        uiReferenceBase64,
        projectDeadline,
        additionalFeatures,
        integrationRequirements,
        additionalComments,
        acceptedTerms,
        acceptedPrivacy,
        consentRegistrationNotifications,
        consentMarketing,
      });

      setPendingStatusInfo({
        registrationId: res.registrationId,
        projectName: res.projectName,
        fullName,
        email: res.email,
        status: res.status,
        submissionDate: res.submissionDate,
      });
      notify(`Registration ${res.registrationId} submitted for Super Admin approval`, 'success');
      navigate('pending-approval');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Personal Info',
    'Application Types',
    'Business & Stack',
    'UI/UX Preferences',
    'Additional Info',
    'Consent & Submit',
  ];

  const filteredThemes = ALL_THEMES.filter((t) => t.mode === themeModePreference).slice(0, 12);

  return (
    <div className="min-h-screen bg-[#09090C] text-[#F3F4F6] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
          <span className="text-xs text-[#9CA3AF] tabular-nums">Step {step} of 6</span>
        </div>

        <div className="aegion-glass rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white font-display">
                Request Aegion AI Workspace Access
              </h1>
              <p className="text-xs text-[#9CA3AF]">
                Submissions are reviewed by the Super Admin before Application Builder activation.
              </p>
            </div>
            {step === 1 && authProvider !== 'google' && (
              <Button type="button" variant="secondary" size="sm" onClick={handleGooglePrefillClick}>
                Prefill with Google
              </Button>
            )}
          </div>

          {/* 6-Step Progress Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {stepTitles.map((title, idx) => {
              const num = idx + 1;
              const active = step === num;
              const done = step > num;
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    if (num < step) setStep(num);
                  }}
                  className={`text-left p-2 rounded-lg border transition-colors ${
                    active
                      ? 'border-[#8B5CF6] bg-[#7C3AED]/15 text-white'
                      : done
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 cursor-pointer'
                      : 'border-white/10 bg-[#14151C] text-[#6B7280]'
                  }`}
                >
                  <div className="text-[10px] font-mono tabular-nums">0{num}</div>
                  <div className="text-[11px] font-medium truncate">{title}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Email Address *</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Phone Number (WhatsApp enabled) *</span>
                  <input
                    type="tel"
                    required
                    placeholder="+1 415 555 0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Country *</span>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Company Name *</span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Company Website</span>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-medium text-[#D1D5DB]">Job Title *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CTO, Head of Engineering, Founder"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white font-display">
                    Which application are you planning to build?
                  </h2>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Select one or more enterprise domains if your organization plans multiple projects.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {APP_TYPES.map((item) => {
                    const selected = applicationTypes.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAppType(item.id)}
                        className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          selected
                            ? 'border-[#8B5CF6] bg-[#7C3AED]/15'
                            : 'border-white/10 bg-[#14151C] hover:border-white/25'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-white">{item.label}</div>
                          <div className="text-xs text-[#9CA3AF]">{item.detail}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                            selected ? 'bg-[#7C3AED] border-[#8B5CF6] text-white' : 'border-white/20'
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Project Name *</span>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Horizon Enterprise HRMS"
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Business Industry</span>
                    <input
                      type="text"
                      value={businessIndustry}
                      onChange={(e) => setBusinessIndustry(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Project Description *</span>
                  <textarea
                    rows={3}
                    required
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe core business workflows, compliance rules, and user personas..."
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Expected Users</span>
                    <select
                      value={expectedUsers}
                      onChange={(e) => setExpectedUsers(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="1 - 100">1 - 100</option>
                      <option value="100 - 500">100 - 500</option>
                      <option value="500 - 2,500">500 - 2,500</option>
                      <option value="2,500 - 10,000">2,500 - 10,000</option>
                      <option value="10,000+">10,000+</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Preferred Backend Language</span>
                    <select
                      value={preferredBackendLanguage}
                      onChange={(e) => setPreferredBackendLanguage(e.target.value as ProgrammingLanguage)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.language} value={l.language}>
                          {l.language} ({l.framework})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Frontend Framework</span>
                    <select
                      value={preferredFrontendFramework}
                      onChange={(e) => setPreferredFrontendFramework(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="React + TypeScript">React + TypeScript</option>
                      <option value="Next.js + TypeScript">Next.js + TypeScript</option>
                      <option value="Vue 3 + TypeScript">Vue 3 + TypeScript</option>
                      <option value="Angular">Angular</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Preferred Database</span>
                    <select
                      value={preferredDatabase}
                      onChange={(e) => setPreferredDatabase(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MySQL">MySQL</option>
                      <option value="SQL Server">SQL Server</option>
                      <option value="MongoDB">MongoDB</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Expected Complexity</span>
                    <select
                      value={expectedComplexity}
                      onChange={(e) => setExpectedComplexity(e.target.value as typeof expectedComplexity)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Enterprise Multi-Tenant">Enterprise Multi-Tenant</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Deployment Environment</span>
                    <input
                      type="text"
                      value={preferredDeployment}
                      onChange={(e) => setPreferredDeployment(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#D1D5DB]">Required Modules</span>
                  <div className="flex flex-wrap gap-2">
                    {MODULE_PRESETS.map((mod) => {
                      const active = requiredModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => toggleModule(mod)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                            active
                              ? 'border-[#8B5CF6] bg-[#7C3AED]/20 text-white'
                              : 'border-white/10 bg-[#14151C] text-[#9CA3AF] hover:text-white'
                          }`}
                        >
                          {mod}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#D1D5DB]">
                    Would you like to use Aegion's predefined UI themes?
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {THEME_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                          themeOption === opt
                            ? 'border-[#8B5CF6] bg-[#7C3AED]/15 text-white'
                            : 'border-white/10 bg-[#14151C] text-[#D1D5DB]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="themeOption"
                          checked={themeOption === opt}
                          onChange={() => setThemeOption(opt)}
                        />
                        <span className="text-xs font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Theme Mode Preference</span>
                    <select
                      value={themeModePreference}
                      onChange={(e) => setThemeModePreference(e.target.value as 'light' | 'dark')}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="dark">Dark Theme (Obsidian / Midnight Glass)</option>
                      <option value="light">Light Theme (Pearl / Frosted Daylight)</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Application-Specific Preset</span>
                    <select
                      value={selectedThemeId}
                      onChange={(e) => setSelectedThemeId(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      {filteredThemes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.category} — {t.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Custom Accent Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccentColor}
                        onChange={(e) => setCustomAccentColor(e.target.value)}
                        className="h-9 w-12 rounded bg-[#181922] border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customAccentColor}
                        onChange={(e) => setCustomAccentColor(e.target.value)}
                        className="flex-1 bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#D1D5DB]">Typography Preference</span>
                    <select
                      value={typographyPreference}
                      onChange={(e) => setTypographyPreference(e.target.value)}
                      className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="Manrope + Plus Jakarta Sans">Manrope + Plus Jakarta Sans</option>
                      <option value="Inter + JetBrains Mono">Inter + JetBrains Mono</option>
                      <option value="Space Grotesk + IBM Plex Sans">Space Grotesk + IBM Plex Sans</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">
                    UI Reference Upload (Optional · PNG, JPG, WEBP, PDF max 5MB)
                  </span>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-white/20 bg-[#14151C] hover:border-white/35 cursor-pointer">
                    <span className="text-xs text-[#9CA3AF] truncate">
                      {uiReferenceFileName || 'Choose screenshot or design brief PDF...'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#A78BFA] shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      onChange={handleUiReferenceFile}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Target Project Deadline</span>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={(e) => setProjectDeadline(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Additional Features</span>
                  <textarea
                    rows={2}
                    value={additionalFeatures}
                    onChange={(e) => setAdditionalFeatures(e.target.value)}
                    placeholder="Specific audit exports, custom approval workflows, reporting..."
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Integration Requirements</span>
                  <textarea
                    rows={2}
                    value={integrationRequirements}
                    onChange={(e) => setIntegrationRequirements(e.target.value)}
                    placeholder="Stripe, Google Workspace, WhatsApp Cloud API, ERP webhooks..."
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Additional Comments</span>
                  <textarea
                    rows={2}
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </label>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#14151C] border border-white/10 text-xs text-[#9CA3AF] space-y-1">
                  <div className="text-white font-semibold">Review Summary</div>
                  <div>Applicant: {fullName} ({email}) · {companyName}</div>
                  <div>Project: {projectName} · {applicationTypes.join(', ')}</div>
                  <div>Stack: {preferredBackendLanguage} / {preferredFrontendFramework} / {preferredDatabase}</div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-xs text-[#D1D5DB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I accept the Aegion AI Terms of Service (Required)</span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-[#D1D5DB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I accept the Privacy Policy and server-side audit storage terms (Required)</span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-[#D1D5DB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentRegistrationNotifications}
                      onChange={(e) => setConsentRegistrationNotifications(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      I consent to receive relevant registration status and activation notifications via Email and WhatsApp (Required)
                    </span>
                  </label>

                  <div className="pt-2 border-t border-white/10">
                    <label className="flex items-start gap-3 text-xs text-[#9CA3AF] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentMarketing}
                        onChange={(e) => setConsentMarketing(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>Optional: Send me Aegion AI product release notes and architecture updates.</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                Previous
              </Button>

              {step < 6 ? (
                <Button type="button" onClick={handleNext}>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting Registration...' : 'Submit for Super Admin Approval'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
