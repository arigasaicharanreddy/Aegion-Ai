import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  Mail,
  Palette,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { usePlatformTheme } from '../context/PlatformThemeContext';
import { ALL_THEMES } from '../themes';
import { PLATFORM_THEMES } from '../platform-themes/catalog';
import { ThemePreview } from '../components/themes/ThemePreview';
import { Button } from '../components/common/Button';
import { ThemeAmbientBackdrop } from '../components/theme-3d/ThemeAmbientBackdrop';
import { HeroArchitectureShowcase } from '../components/theme-3d/HeroArchitectureShowcase';
import { QuickThemeSwitcher } from '../components/platform-themes/QuickThemeSwitcher';
import { apiClient } from '../services/apiClient';
import type { AppCategory } from '../types/project';
import type { ContactCategory } from '../types/registration';
import agentImg from '/src/assets/images/aegion_agent_orchestration_1794529374170.jpg';
import themeImg from '/src/assets/images/aegion_theme_catalog_1794529373377.jpg';

const WHAT_AEGION_DOES = [
  {
    icon: <Sparkles className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'AI-Guided Application Creation',
    detail:
      'Describe your product goals in plain business language and collaborate with Aegion AI to turn concepts into complete, organized software workspaces.',
  },
  {
    icon: <Workflow className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Automated Workflow Structuring',
    detail:
      'Automatically organize multi-step approvals, role permissions, operational checklists, and department handoffs tailored to your business processes.',
  },
  {
    icon: <Layers className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Smart Requirement Understanding',
    detail:
      'Aegion AI retains your business context across iterations, converting complex operational policies into clear specifications before any changes apply.',
  },
  {
    icon: <Palette className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Customizable Interface Themes',
    detail:
      'Personalize the entire Aegion AI platform across 10 curated dark and light design systems while selecting from 50 independent visual themes for your generated apps.',
  },
  {
    icon: <Zap className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Fast Prototype-to-Product Delivery',
    detail:
      'Move from initial discovery to interactive team review and downloadable application packages in a fraction of traditional delivery timelines.',
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Enterprise Access & Governance',
    detail:
      'Enforce request-based workspace approvals, single-use onboarding verification, role isolation, version snapshots, and instant rollback controls.',
  },
];

const SUPPORTED_APPLICATIONS: {
  category: AppCategory;
  title: string;
  summary: string;
  highlights: string;
}[] = [
  {
    category: 'HRMS',
    title: 'Human Resource Management Systems (HRMS)',
    summary:
      'Streamline employee onboarding, attendance tracking, multi-tier leave approvals, and monthly payroll coordination across departments.',
    highlights: 'Employee Records · Attendance · Payroll · Leave Governance',
  },
  {
    category: 'E-Commerce',
    title: 'E-Commerce Platforms',
    summary:
      'Launch storefront catalogs, guided customer checkout journeys, inventory reservations, and automated order fulfillment pipelines.',
    highlights: 'Product Catalog · Shopping Cart · Orders · Customer Accounts',
  },
  {
    category: 'Multi-Store Management',
    title: 'Multi-Store Management Systems',
    summary:
      'Unify multi-branch retail operations with centralized catalog pricing, inter-store stock transfers, supplier coordination, and branch reporting.',
    highlights: 'Branch Warehouses · Stock Transfers · Store Metrics · Point of Sale',
  },
  {
    category: 'SaaS Applications',
    title: 'SaaS Products',
    summary:
      'Deliver multi-organization subscription software complete with isolated company workspaces, team roles, usage metering, and billing controls.',
    highlights: 'Multi-Tenant Workspaces · Subscriptions · Usage Tracking · Integrations',
  },
  {
    category: 'Healthcare Store Management',
    title: 'Healthcare and Pharmacy Store Systems',
    summary:
      'Manage prescription verification, batch expiration tracking, cold-chain inventory alerts, and compliant patient billing workflows.',
    highlights: 'Prescription Checks · Batch Expiry Alerts · Reorder Automation · Audit Trail',
  },
  {
    category: 'Custom Business Applications',
    title: 'Custom Business Operations Software',
    summary:
      'Replace fragmented spreadsheets with purpose-built internal portals, approval consoles, vendor workflows, and executive dashboards.',
    highlights: 'Custom Approvals · Operations Portals · Reporting · Role Access',
  },
];

const WHY_CHOOSE_AEGION = [
  {
    icon: <Clock className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Speed Without Compromise',
    detail:
      'Eliminate months of manual scoping delays while keeping every screen, rule, and permission transparent for leadership review.',
  },
  {
    icon: <Building2 className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Tailored to Your Organization',
    detail:
      'Software adapts to your real approval hierarchy, compliance standards, and daily operations—never forcing rigid generic templates.',
  },
  {
    icon: <Users className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Controlled Multi-Team Onboarding',
    detail:
      'Dedicated approval governance verifies every new user before workspace entry, keeping sensitive business concepts strictly protected.',
  },
  {
    icon: <Lock className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
    title: 'Complete Ownership & Portability',
    detail:
      'Export complete project deliverables cleanly at any stage with full version history, audit logs, and zero platform lock-in.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Request Workspace Access',
    detail:
      'Share your organization details, target application domain, and design preferences through our guided six-step intake.',
  },
  {
    step: '02',
    title: 'Super Admin Review and Approval',
    detail:
      'Every application request is reviewed by the Aegion AI administration team to verify fit and protect workspace integrity.',
  },
  {
    step: '03',
    title: 'Secure Account Activation',
    detail:
      'Once approved, receive a time-limited single-use activation link to set your credentials and unlock your workspace.',
  },
  {
    step: '04',
    title: 'Describe Your Application Idea',
    detail:
      'Collaborate with Aegion AI in clear business terms to outline user roles, workflows, and operational goals.',
  },
  {
    step: '05',
    title: 'Customize Design & Workflows',
    detail:
      'Personalize your workspace with 10 curated platform themes plus 50 generated application themes before saving.',
  },
  {
    step: '06',
    title: 'Generate and Refine with AI',
    detail:
      'Iterate conversationally with version snapshots and instant rollback checkpoints at every milestone.',
  },
  {
    step: '07',
    title: 'Launch and Scale',
    detail:
      'Export your completed application package, onboard approved team collaborators, and grow with confidence.',
  },
];

const CONTACT_CATEGORIES: ContactCategory[] = [
  'General Inquiry',
  'Business Partnership',
  'Product Information',
  'Technical Support',
  'Workspace Access',
  'Other',
];

const SHOWCASE_PLATFORM_IDS = [
  'obsidian-glass',
  'aurora-liquid-glass',
  'graphite-executive',
  'neural-cosmos',
  'swiss-precision',
  'ivory-executive',
];

export const LandingPage: React.FC = () => {
  const { navigate, createProject, user, notify } = useAegion();
  const { activeTheme, applyTheme } = usePlatformTheme();
  const [featuredThemeId, setFeaturedThemeId] = useState('hrms-aurora-hr');
  const featuredThemes = ALL_THEMES.filter((t) =>
    ['hrms-aurora-hr', 'hrms-nebula-hr', 'saas-cloud-midnight', 'hc-aqua-clinical'].includes(t.id)
  );
  const showcasePlatformThemes = PLATFORM_THEMES.filter((t) =>
    SHOWCASE_PLATFORM_IDS.includes(t.id)
  );

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactCategory, setContactCategory] = useState<ContactCategory>('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactConfirmation, setContactConfirmation] = useState<{
    inquiryId: string;
    message: string;
  } | null>(null);

  const handleSelectSolution = (category: AppCategory, title: string, summary: string) => {
    if (!user || user.status !== 'active') {
      notify('Complete the 6-step registration to request workspace access for this solution.', 'info');
      navigate('register');
      return;
    }
    createProject({
      name: `${category} Workspace`,
      description: summary,
      category,
      language: 'Python',
      initialPrompt: `Create a ${title} solution tailored for our business operations: ${summary}`,
    });
    navigate('builder');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSubmitting(true);
    try {
      const res = await apiClient.submitContactInquiry({
        fullName: contactName,
        email: contactEmail,
        company: contactCompany,
        subject: contactSubject,
        category: contactCategory,
        message: contactMessage,
        website_hp: honeypot,
      });
      setContactConfirmation({ inquiryId: res.inquiryId, message: res.message });
      setContactName('');
      setContactEmail('');
      setContactCompany('');
      setContactSubject('');
      setContactCategory('General Inquiry');
      setContactMessage('');
      setHoneypot('');
      notify('Your inquiry has been submitted.', 'success');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send your inquiry right now.');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] transition-colors duration-300">
      <ThemeAmbientBackdrop variant="public" />

      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--aegion-platform-border)] aegion-nav-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-[var(--aegion-platform-text)] font-display whitespace-nowrap shrink-0"
          >
            Aegion AI
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[var(--aegion-platform-text-muted)]">
            <a
              href="#about"
              className="hover:text-[var(--aegion-platform-text)] transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#features"
              className="hover:text-[var(--aegion-platform-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#solutions"
              className="hover:text-[var(--aegion-platform-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Solutions
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[var(--aegion-platform-text)] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="hover:text-[var(--aegion-platform-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <QuickThemeSwitcher />
            {user?.status === 'active' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => navigate(user.role === 'super_admin' ? 'admin' : 'dashboard')}
              >
                Open Workspace
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" size="sm" onClick={() => navigate('login')}>
                  Sign In
                </Button>
                <Button type="button" size="sm" onClick={() => navigate('register')}>
                  <span className="sm:hidden">Request Access</span>
                  <span className="hidden sm:inline">Request Workspace Access</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10">
        {/* 1. Hero Section with Interactive Three.js 3D Architecture */}
        <section id="top" className="max-w-7xl mx-auto px-6 pt-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--aegion-platform-accent)] tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Application Creation Studio for Businesses</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--aegion-platform-text)] font-display leading-[1.08] [text-wrap:balance]">
                Turn Your Business Ideas Into Powerful Applications With AI.
              </h1>
              <p className="text-base text-[var(--aegion-platform-text-muted)] leading-relaxed max-w-xl">
                Aegion AI helps businesses transform their ideas into intelligent, scalable software
                solutions. Describe your requirements, collaborate with AI, and build applications
                designed around your business workflows.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {user?.status === 'active' ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => navigate(user.role === 'super_admin' ? 'admin' : 'builder')}
                  >
                    Open Workspace
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button type="button" size="lg" onClick={() => navigate('register')}>
                      Request Workspace Access
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={() => navigate('login')}
                    >
                      Sign In
                    </Button>
                  </>
                )}
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 aegion-btn-shape px-4 py-3 text-sm font-medium bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border-strong)] transition-colors"
                >
                  Explore Features
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 aegion-btn-shape px-4 py-3 text-sm font-medium text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border)] hover:border-[var(--aegion-platform-border-strong)] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                </a>
              </div>

              {/* Instant Public Platform Theme Experience Strip */}
              <div className="pt-3 border-t border-[var(--aegion-platform-border)] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--aegion-platform-text-muted)]">
                  <span>Experience Platform Themes ({activeTheme.name})</span>
                  <span className="text-[11px] text-[var(--aegion-platform-accent)] font-medium">
                    10 Curated Enterprise Styles
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {showcasePlatformThemes.map((pt) => {
                    const selected = activeTheme.id === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => void applyTheme(pt.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer aegion-btn-shape ${
                          selected
                            ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                            : 'bg-[var(--aegion-platform-surface-solid)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: pt.palette.accent }}
                        />
                        <span>{pt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Enterprise AI Architecture Blueprint */}
            <div className="lg:col-span-6">
              <HeroArchitectureShowcase />
            </div>
          </div>
        </section>

        {/* 2. About Aegion AI */}
        <section
          id="about"
          className="border-t border-[var(--aegion-platform-border)] py-20 bg-[var(--aegion-platform-bg-alt)]"
        >
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div
                className="overflow-hidden border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] aspect-[4/3]"
                style={{ borderRadius: 'var(--aegion-platform-radius)' }}
              >
                <img
                  src={agentImg}
                  alt="Aegion AI turning business goals into structured software workflows"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                About Aegion AI
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                Built for business clarity, speed, and operational confidence
              </h2>
              <p className="text-sm text-[var(--aegion-platform-text-muted)] leading-relaxed">
                Organizations shouldn&apos;t have to settle for rigid software that forces teams into
                awkward workarounds—or wait quarters for traditional delivery cycles. Aegion AI puts
                a collaborative AI product studio at your fingertips, translating your company&apos;s
                policies, user roles, and daily operations into cohesive, launch-ready applications.
              </p>
              <p className="text-sm text-[var(--aegion-platform-text-muted)] leading-relaxed">
                Every workspace is protected by verified onboarding, structured change reviews, and
                complete version history so founders, department heads, and product teams move fast
                without ever sacrificing security or control.
              </p>
            </div>
          </div>
        </section>

        {/* 3. What Aegion AI Does */}
        <section id="features" className="border-t border-[var(--aegion-platform-border)] py-20">
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                What Aegion AI Does
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                Everything required to go from business idea to tailored application
              </h2>
              <p className="text-sm text-[var(--aegion-platform-text-muted)]">
                Six integrated capabilities designed around real organizational workflows and oversight.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {WHAT_AEGION_DOES.map((item) => (
                <div
                  key={item.title}
                  className="aegion-glass p-6 space-y-3 hover:border-[var(--aegion-platform-border-strong)] transition-colors"
                >
                  <div className="w-9 h-9 aegion-btn-shape bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Applications We Support + Visual Themes Showcase */}
        <section
          id="solutions"
          className="border-t border-[var(--aegion-platform-border)] py-20 bg-[var(--aegion-platform-bg-alt)]"
        >
          <div className="max-w-7xl mx-auto px-6 space-y-14">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                Applications We Support
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                Industry-ready foundations customized to your operations
              </h2>
              <p className="text-sm text-[var(--aegion-platform-text-muted)]">
                Start with a proven operational blueprint across six major business domains or combine capabilities to fit your enterprise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SUPPORTED_APPLICATIONS.map((app) => (
                <div
                  key={app.category}
                  className="aegion-glass p-6 flex flex-col justify-between gap-5 hover:border-[var(--aegion-platform-border-strong)] transition-colors"
                >
                  <div className="space-y-2.5">
                    <h3 className="text-lg font-semibold text-[var(--aegion-platform-text)] font-display">
                      {app.title}
                    </h3>
                    <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                      {app.summary}
                    </p>
                    <div className="text-[11px] text-[var(--aegion-platform-text-secondary)] pt-1">
                      {app.highlights}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectSolution(app.category, app.title, app.summary)}
                  >
                    <span>{user?.status === 'active' ? 'Open in Workspace' : 'Request Access for Solution'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Curated Generated App Design System Preview (Independent from Platform Theme) */}
            <div className="pt-8 border-t border-[var(--aegion-platform-border)] space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                    Brand &amp; Visual Flexibility
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
                    50 curated light and dark themes for your generated business applications
                  </h3>
                  <p className="text-sm text-[var(--aegion-platform-text-muted)] leading-relaxed">
                    In addition to personalizing the Aegion AI workspace itself across 10 curated platform themes, every application you generate includes 50 independent visual themes—keeping rules, permissions, and workflows cleanly intact.
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <div
                    className="overflow-hidden border border-[var(--aegion-platform-border)] aspect-[16/9] bg-[var(--aegion-platform-surface-solid)]"
                    style={{ borderRadius: 'var(--aegion-platform-radius)' }}
                  >
                    <img
                      src={themeImg}
                      alt="Aegion AI curated visual theme collection"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredThemes.map((preset) => (
                  <ThemePreview
                    key={preset.id}
                    preset={preset}
                    selected={featuredThemeId === preset.id}
                    onSelect={() => setFeaturedThemeId(preset.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Why Choose Aegion AI? */}
        <section id="why-aegion" className="border-t border-[var(--aegion-platform-border)] py-20">
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                Why Choose Aegion AI?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                Designed for teams that value clarity, ownership, and dependable governance
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {WHY_CHOOSE_AEGION.map((reason) => (
                <div key={reason.title} className="aegion-glass p-6 flex items-start gap-4">
                  <div className="w-9 h-9 aegion-btn-shape bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center shrink-0">
                    {reason.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                      {reason.title}
                    </h3>
                    <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                      {reason.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. How It Works (Steps 1-7) */}
        <section
          id="how-it-works"
          className="border-t border-[var(--aegion-platform-border)] py-20 bg-[var(--aegion-platform-bg-alt)]"
        >
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                  How It Works
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                  From access request to live business application in seven guided steps
                </h2>
              </div>
              <Button type="button" size="sm" onClick={() => navigate('register')}>
                Request Workspace Access
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS_STEPS.map((item) => (
                <div key={item.step} className="aegion-glass p-5 space-y-2.5">
                  <div className="text-xs font-mono font-semibold text-[var(--aegion-platform-accent)]">
                    STEP {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. About the Company */}
        <section className="border-t border-[var(--aegion-platform-border)] py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                About the Company
              </div>
              <h2 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
                Aegion AI — Partnering with ambitious organizations to modernize operations
              </h2>
              <p className="text-sm text-[var(--aegion-platform-text-muted)] leading-relaxed">
                Aegion AI was created with a clear mission: empower businesses of every size to turn
                specialized operational knowledge into dependable, custom-fitted software without
                unnecessary friction. By combining human review governance with intelligent design
                automation, we ensure every organization launches applications that fit their people,
                processes, and brand standards.
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Onboarding Model', value: 'Verified Approval' },
                { label: 'Theme Engine', value: '10 Platform · 50 App' },
                { label: 'Business Domains', value: '6 Core Industries' },
                { label: 'Ownership', value: 'Full Project Export' },
              ].map((stat) => (
                <div key={stat.label} className="aegion-glass p-4 space-y-1">
                  <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{stat.label}</div>
                  <div className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Contact Us (No plain email displayed anywhere) */}
        <section
          id="contact"
          className="border-t border-[var(--aegion-platform-border)] py-20 bg-[var(--aegion-platform-bg-alt)]"
        >
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[var(--aegion-platform-accent)] uppercase tracking-wider">
                  Contact Us
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--aegion-platform-text)] font-display">
                  Connect with our team
                </h2>
                <p className="text-sm text-[var(--aegion-platform-text-muted)] leading-relaxed">
                  Have questions about Aegion AI, enterprise partnerships, onboarding, or custom business
                  solutions? Submit your inquiry using the structured form and our team will review it
                  promptly.
                </p>
              </div>

              <div className="aegion-glass p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 aegion-btn-shape bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                      Protected Inquiry Routing
                    </div>
                    <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                      Every submission is tracked with a dedicated Inquiry ID, routed directly to our
                      administration team, and backed by structured follow-up tracking.
                    </p>
                  </div>
                </div>
              </div>

              <div className="aegion-glass p-5 space-y-3 text-xs text-[var(--aegion-platform-text-muted)]">
                <div className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                  Looking to access the Application Builder?
                </div>
                <p className="leading-relaxed">
                  New users must complete our 6-step registration request and receive approval before
                  activating workspace credentials.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => navigate('register')}>
                    Request Workspace Access
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('pending-approval')}
                  >
                    Check Approval Status
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="aegion-glass p-6 sm:p-8">
                {contactConfirmation ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-[var(--aegion-platform-text)] font-display">
                        Inquiry Received ({contactConfirmation.inquiryId})
                      </h3>
                      <p className="text-xs text-[var(--aegion-platform-text-secondary)] max-w-md mx-auto leading-relaxed">
                        {contactConfirmation.message}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setContactConfirmation(null)}
                    >
                      Submit Another Inquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[var(--aegion-platform-text)] font-display">
                        Send an Inquiry
                      </h3>
                      <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                        All fields below are required so our team can route your message accurately.
                      </p>
                    </div>

                    <div className="sr-only" aria-hidden="true">
                      <label>
                        Leave this field blank
                        <input
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                          Full Name *
                        </span>
                        <input
                          type="text"
                          required
                          minLength={2}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Priya Sharma"
                          className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                          Business Email *
                        </span>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                          Company Name *
                        </span>
                        <input
                          type="text"
                          required
                          value={contactCompany}
                          onChange={(e) => setContactCompany(e.target.value)}
                          placeholder="Acme Operations Pvt Ltd"
                          className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                        />
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                          Inquiry Category *
                        </span>
                        <select
                          required
                          value={contactCategory}
                          onChange={(e) => setContactCategory(e.target.value as ContactCategory)}
                          className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                        >
                          {CONTACT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                        Subject *
                      </span>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Brief summary of your inquiry"
                        className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                        Message *
                      </span>
                      <textarea
                        required
                        minLength={10}
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Share your business goals, timeline, or questions..."
                        className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                      />
                    </label>

                    {contactError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                        {contactError}
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={contactSubmitting}>
                      <Send className="w-4 h-4" />
                      <span>{contactSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quiet Footer (No plain contact email displayed) */}
        <footer className="border-t border-[var(--aegion-platform-border)] py-10">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--aegion-platform-text-muted)]">
            <div className="space-y-1">
              <div className="font-semibold text-[var(--aegion-platform-text)] font-display">
                Aegion AI
              </div>
              <div>Intelligent Business Applications &amp; Enterprise Access Platform</div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#about" className="hover:text-[var(--aegion-platform-text)]">
                About
              </a>
              <a href="#features" className="hover:text-[var(--aegion-platform-text)]">
                Features
              </a>
              <a href="#solutions" className="hover:text-[var(--aegion-platform-text)]">
                Solutions
              </a>
              <a href="#how-it-works" className="hover:text-[var(--aegion-platform-text)]">
                How It Works
              </a>
              <a href="#contact" className="hover:text-[var(--aegion-platform-text)]">
                Contact Us
              </a>
              <button
                type="button"
                onClick={() => navigate('register')}
                className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
              >
                Request Access
              </button>
              <button
                type="button"
                onClick={() => navigate('pending-approval')}
                className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
              >
                Check Status
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
