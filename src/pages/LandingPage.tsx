import React, { useState } from 'react';
import { ArrowRight, Layers, Code2, Palette, ShieldCheck } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { APPLICATION_TEMPLATES, SUPPORTED_LANGUAGES } from '../config/appConfig';
import { ALL_THEMES } from '../themes';
import { ThemePreview } from '../components/themes/ThemePreview';
import { Button } from '../components/common/Button';
import heroImg from '/src/assets/images/aegion_hero_architecture_1794529377471.jpg';
import agentImg from '/src/assets/images/aegion_agent_orchestration_1794529374170.jpg';
import themeImg from '/src/assets/images/aegion_theme_catalog_1794529373377.jpg';

export const LandingPage: React.FC = () => {
  const { navigate, createProject, user, runtimeMode, enterFreeDevPreview } = useAegion();
  const [featuredThemeId, setFeaturedThemeId] = useState('hrms-aurora-hr');
  const featuredThemes = ALL_THEMES.filter((t) =>
    ['hrms-aurora-hr', 'hrms-nebula-hr', 'saas-cloud-midnight', 'hc-aqua-clinical'].includes(t.id)
  );

  const handleLaunchTemplate = async (tplCategory: (typeof APPLICATION_TEMPLATES)[number]['category']) => {
    const tpl = APPLICATION_TEMPLATES.find((t) => t.category === tplCategory) || APPLICATION_TEMPLATES[0];
    if (!user || user.status !== 'active') {
      if (runtimeMode.freeDevMode) {
        await enterFreeDevPreview('builder', 'builder');
      } else {
        navigate('register');
        return;
      }
    }
    createProject({
      name: `${tpl.category} Studio App`,
      description: tpl.summary,
      category: tpl.category,
      language: tpl.defaultLanguage,
      themeId: tpl.defaultThemeId,
      initialPrompt: tpl.samplePrompt,
    });
    navigate('builder');
  };

  return (
    <div className="min-h-screen bg-[#09090C] text-[#F3F4F6]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090C]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
          >
            Aegion AI
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9CA3AF]">
            <a href="#architecture" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Architecture
            </a>
            <a href="#templates" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Templates
            </a>
            <a href="#languages" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Languages
            </a>
            <a href="#themes" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Glass Themes
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            {!user && (
              <Button type="button" variant="secondary" size="sm" onClick={() => navigate('login')}>
                Sign In
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(user?.status === 'active' ? 'builder' : 'register')}
            >
              {user?.status === 'active' ? 'Open Workspace' : 'Request Access'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-7xl mx-auto px-6 pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="text-xs font-medium text-[#A78BFA] tracking-wide">
              Python FastAPI · LangGraph Orchestration · 12 Target Languages
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-display leading-[1.1] [text-wrap:balance]">
              Agentic application engineering from specification to source code.
            </h1>
            <p className="text-base text-[#9CA3AF] leading-relaxed max-w-xl">
              Describe enterprise business software in conversation. Aegion AI coordinates
              specialized architecture, database, security, and code-generation agents to
              produce full-stack systems in Python, Java, TypeScript, Go, PHP, C#, and more—with
              a decoupled 50-theme Glass UI token system.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {user?.status === 'active' ? (
                <Button type="button" size="lg" onClick={() => navigate('builder')}>
                  Launch Application Builder
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : runtimeMode.freeDevMode ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => enterFreeDevPreview('builder', 'builder')}
                >
                  Open Free Dev Workspace
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => navigate('register')}>
                  Register for Workspace Access
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(user?.status === 'active' ? 'themes' : 'register')}
              >
                {user?.status === 'active' ? 'Explore 50 Glass Themes' : '6-Step Registration'}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-xl overflow-hidden border border-white/10 bg-[#121318] relative">
              <img
                src={heroImg}
                alt="Aegion AI layered obsidian glass architecture"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090C]/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-[#D1D5DB]">
                <span>React Frontend · Separate FastAPI Service</span>
                <span className="tabular-nums">50 Design Token Presets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-column capability strip below hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-10 border-t border-white/10">
          {[
            {
              icon: <Layers className="w-4 h-4 text-[#A78BFA]" />,
              title: '11-Agent LangGraph Flow',
              detail: 'Intent, Requirements, Architect, UI/UX, Database, Backend, Frontend, Security, Testing.',
            },
            {
              icon: <Code2 className="w-4 h-4 text-[#A78BFA]" />,
              title: '12 Language Prompt Packs',
              detail: 'Respects user stack choices without restricting outputs to Python alone.',
            },
            {
              icon: <Palette className="w-4 h-4 text-[#A78BFA]" />,
              title: 'Decoupled Glass UI Tokens',
              detail: 'Switch between 50 light and dark presets without rewriting business logic.',
            },
            {
              icon: <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />,
              title: 'RBAC & Project Memory',
              detail: 'Versioned specifications, rollback snapshots, and protected platform prompts.',
            },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-[#121318] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-display">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 1: Python + LangGraph Architecture */}
      <section id="architecture" className="border-t border-white/10 py-20 bg-[#0C0D12]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#121318] aspect-[4/3]">
              <img
                src={agentImg}
                alt="Modular multi-agent orchestration blocks"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Separated frontend agility and Python agent orchestration
              </h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Google AI Studio hosts and iterates on the React TypeScript workspace, while your
                Python FastAPI, LangGraph, LangChain, and pgvector RAG backend runs as an isolated,
                independently deployable service connected over typed REST and SSE contracts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {[
                {
                  num: '01. Specification & Memory',
                  text: 'Captures roles, business rules, schemas, and prompt history before every code update.',
                },
                {
                  num: '02. Retrieval-Augmented Packs',
                  text: 'Combines 9 prompt layers from Core Security down to target language idioms.',
                },
                {
                  num: '03. Approval-Gated Diffs',
                  text: 'Review generated controllers, SQL migrations, and tests before committing a version.',
                },
                {
                  num: '04. Isolated Container Export',
                  text: 'Download clean ZIP bundles or export the Python FastAPI + Docker scaffold directly.',
                },
              ].map((step) => (
                <div key={step.num} className="space-y-1.5 border-t border-white/10 pt-3">
                  <div className="text-sm font-semibold text-white font-display">{step.num}</div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Application Templates */}
      <section id="templates" className="border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Six enterprise application templates
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                Start from domain-grounded architectures or describe custom workflows in natural language.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('templates')}>
              View All Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {APPLICATION_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-6 rounded-xl bg-[#121318] border border-white/10 flex flex-col justify-between gap-5 hover:border-white/20 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="text-xs text-[#A78BFA]">
                    {tpl.category} · Default {tpl.defaultLanguage}
                  </div>
                  <h3 className="text-lg font-semibold text-white font-display">{tpl.title}</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{tpl.summary}</p>
                  <div className="text-[11px] text-[#D1D5DB] pt-1">
                    {tpl.coreModules.join(' · ')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLaunchTemplate(tpl.category)}
                >
                  Build with {tpl.category}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: 12 Supported Programming Languages */}
      <section id="languages" className="border-t border-white/10 py-20 bg-[#0C0D12]">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Multi-language code generation engine
            </h2>
            <p className="text-sm text-[#9CA3AF]">
              Target outputs are governed by language-specific prompt packs, ORM adapters, security rules, and test runners.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.language}
                className="p-4 rounded-xl bg-[#121318] border border-white/10 space-y-1"
              >
                <div className="text-sm font-semibold text-white font-display">
                  {lang.language} / {lang.framework}
                </div>
                <div className="text-xs text-[#9CA3AF]">{lang.ormOrDbAdapter}</div>
                <div className="text-[11px] font-mono text-[#6B7280] pt-1">{lang.testRunner}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Glass UI Theme System */}
      <section id="themes" className="border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                50 Glass UI presets decoupled from application logic
              </h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Five light and five dark themes across HRMS, E-Commerce, Multi-Store, SaaS, and
                Healthcare Store. Every visual attribute resolves through CSS variables so switching
                from Pearl Workforce to Nebula HR updates styling instantaneously.
              </p>
              <div className="pt-2">
                <Button type="button" variant="secondary" onClick={() => navigate('themes')}>
                  Open Full Theme Gallery
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-white/10 aspect-[4/3] bg-[#121318]">
                <img
                  src={themeImg}
                  alt="Architectural glass material swatch board"
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
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <span className="font-semibold text-white font-display">Aegion AI</span>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => navigate('builder')} className="hover:text-white cursor-pointer">
              Builder Studio
            </button>
            <button type="button" onClick={() => navigate('prompts')} className="hover:text-white cursor-pointer">
              Prompt Registry
            </button>
            <button type="button" onClick={() => navigate('support')} className="hover:text-white cursor-pointer">
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
