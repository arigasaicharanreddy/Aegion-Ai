import { AgentNodeId } from '../types/chat';
import { AppCategory, ProgrammingLanguage } from '../types/project';
import { PromptLayer } from '../types/prompt';

export interface LanguageOption {
  language: ProgrammingLanguage;
  framework: string;
  runtime: string;
  ormOrDbAdapter: string;
  buildConfig: string;
  testRunner: string;
  promptPackId: string;
  summary: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    language: 'Python',
    framework: 'FastAPI',
    runtime: 'Python 3.12 · Uvicorn',
    ormOrDbAdapter: 'SQLAlchemy 2.0 + Alembic',
    buildConfig: 'pyproject.toml + Dockerfile',
    testRunner: 'pytest + httpx',
    promptPackId: 'pack-python-fastapi',
    summary: 'Default Aegion generation stack with async FastAPI, Pydantic v2, and SQLAlchemy.',
  },
  {
    language: 'Java',
    framework: 'Spring Boot',
    runtime: 'JDK 21 · Maven / Gradle',
    ormOrDbAdapter: 'Spring Data JPA + Flyway',
    buildConfig: 'pom.xml + Dockerfile',
    testRunner: 'JUnit 5 + Testcontainers',
    promptPackId: 'pack-java-spring',
    summary: 'Enterprise layered REST services with Spring Security JWT and JPA repositories.',
  },
  {
    language: 'TypeScript',
    framework: 'NestJS',
    runtime: 'Node.js 22 · TypeScript 5',
    ormOrDbAdapter: 'Prisma / Drizzle ORM',
    buildConfig: 'tsconfig.json + package.json',
    testRunner: 'Vitest / Jest + Supertest',
    promptPackId: 'pack-ts-nestjs',
    summary: 'Modular dependency-injected TypeScript backend with OpenAPI decorators.',
  },
  {
    language: 'JavaScript',
    framework: 'Node.js / Express',
    runtime: 'Node.js 22 · ESM',
    ormOrDbAdapter: 'Knex / Sequelize',
    buildConfig: 'package.json + Dockerfile',
    testRunner: 'Vitest + Supertest',
    promptPackId: 'pack-js-express',
    summary: 'Lightweight Express router architecture with Zod validation and JWT middleware.',
  },
  {
    language: 'PHP',
    framework: 'Laravel',
    runtime: 'PHP 8.3 · PHP-FPM',
    ormOrDbAdapter: 'Eloquent ORM + Migrations',
    buildConfig: 'composer.json + artisan',
    testRunner: 'Pest / PHPUnit',
    promptPackId: 'pack-php-laravel',
    summary: 'Resource controllers, FormRequests, Policies, and Sanctum authentication.',
  },
  {
    language: 'Go',
    framework: 'Gin',
    runtime: 'Go 1.23',
    ormOrDbAdapter: 'GORM / sqlc + pgx',
    buildConfig: 'go.mod + multi-stage Dockerfile',
    testRunner: 'go test + httptest',
    promptPackId: 'pack-go-gin',
    summary: 'High-concurrency Go microservices with clean handler-service-repository layering.',
  },
  {
    language: 'C#',
    framework: '.NET 9 Web API',
    runtime: '.NET 9 CLR',
    ormOrDbAdapter: 'Entity Framework Core',
    buildConfig: 'AegionApp.csproj + Dockerfile',
    testRunner: 'xUnit + WebApplicationFactory',
    promptPackId: 'pack-csharp-dotnet',
    summary: 'Minimal APIs or controllers with MediatR CQRS and EF Core migrations.',
  },
  {
    language: 'Ruby',
    framework: 'Ruby on Rails',
    runtime: 'Ruby 3.3 · Puma',
    ormOrDbAdapter: 'ActiveRecord',
    buildConfig: 'Gemfile + config/routes.rb',
    testRunner: 'RSpec + FactoryBot',
    promptPackId: 'pack-ruby-rails',
    summary: 'Convention-driven Rails API mode with Pundit authorization and serializers.',
  },
  {
    language: 'Rust',
    framework: 'Axum',
    runtime: 'Rust 2024 · Tokio',
    ormOrDbAdapter: 'SQLx (compile-time checked)',
    buildConfig: 'Cargo.toml + Dockerfile',
    testRunner: 'cargo test',
    promptPackId: 'pack-rust-axum',
    summary: 'Memory-safe async Axum routers with Tower middleware and SQLx pools.',
  },
  {
    language: 'Kotlin',
    framework: 'Ktor / Android',
    runtime: 'JVM 21 / Android SDK',
    ormOrDbAdapter: 'Exposed / Room',
    buildConfig: 'build.gradle.kts',
    testRunner: 'Kotest + MockK',
    promptPackId: 'pack-kotlin-ktor',
    summary: 'Coroutines-first Kotlin server APIs or Jetpack Compose mobile client scaffolds.',
  },
  {
    language: 'Swift',
    framework: 'Vapor / iOS',
    runtime: 'Swift 6 · SwiftUI',
    ormOrDbAdapter: 'Fluent / SwiftData',
    buildConfig: 'Package.swift',
    testRunner: 'XCTest / Swift Testing',
    promptPackId: 'pack-swift-vapor',
    summary: 'Type-safe Swift backend services or native SwiftUI client modules.',
  },
  {
    language: 'C++',
    framework: 'Drogon / Qt Services',
    runtime: 'C++20 · CMake',
    ormOrDbAdapter: 'libpqxx / Drogon ORM',
    buildConfig: 'CMakeLists.txt + Dockerfile',
    testRunner: 'GoogleTest',
    promptPackId: 'pack-cpp-drogon',
    summary: 'Low-latency C++20 service endpoints and high-throughput domain engines.',
  },
];

export interface AppTemplateSpec {
  id: string;
  category: AppCategory;
  title: string;
  summary: string;
  defaultLanguage: ProgrammingLanguage;
  defaultThemeId: string;
  coreModules: string[];
  defaultRoles: string[];
  samplePrompt: string;
}

export const APPLICATION_TEMPLATES: AppTemplateSpec[] = [
  {
    id: 'tpl-hrms',
    category: 'HRMS',
    title: 'Human Resource Management Suite',
    summary:
      'Employee directory, shift attendance, automated payroll runs, leave approvals, and performance cycles.',
    defaultLanguage: 'Python',
    defaultThemeId: 'hrms-nebula-hr',
    coreModules: ['Employee Directory', 'Attendance Tracking', 'Payroll Engine', 'Leave Management', 'Org Chart'],
    defaultRoles: ['HR Admin', 'Payroll Manager', 'Department Lead', 'Employee'],
    samplePrompt:
      'Build an HRMS application with employee management, attendance, payroll, and leave management. Use Java Spring Boot.',
  },
  {
    id: 'tpl-ecommerce',
    category: 'E-Commerce',
    title: 'Modern E-Commerce Storefront & Admin',
    summary:
      'Catalog management, SKU variants, cart & checkout orchestration, order fulfillment, and customer retention.',
    defaultLanguage: 'TypeScript',
    defaultThemeId: 'ecom-violet-retail',
    coreModules: ['Product Catalog', 'Cart & Checkout', 'Order Fulfillment', 'Customer CRM', 'Promotions'],
    defaultRoles: ['Store Owner', 'Merchandiser', 'Fulfillment Ops', 'Customer'],
    samplePrompt:
      'Generate a B2C e-commerce platform with SKU variants, Stripe webhook checkout, and warehouse fulfillment using TypeScript NestJS.',
  },
  {
    id: 'tpl-multistore',
    category: 'Multi-Store Management',
    title: 'Multi-Store Retail & POS Network',
    summary:
      'Cross-branch inventory transfers, centralized POS terminal sync, regional pricing, and store P&L rollups.',
    defaultLanguage: 'Go',
    defaultThemeId: 'ms-prism-dark',
    coreModules: ['Branch Registry', 'Inter-Store Transfers', 'POS Sync', 'Regional Pricing', 'Consolidated Ledger'],
    defaultRoles: ['Chain Executive', 'Regional Manager', 'Store Cashier', 'Inventory Auditor'],
    samplePrompt:
      'Create a multi-store retail ERP with inter-branch stock transfers and POS terminal synchronization in Go Gin.',
  },
  {
    id: 'tpl-saas',
    category: 'SaaS Applications',
    title: 'Multi-Tenant B2B SaaS Platform',
    summary:
      'Tenant isolation, subscription metering, RBAC permissions, webhook delivery, and usage analytics.',
    defaultLanguage: 'Python',
    defaultThemeId: 'saas-cloud-midnight',
    coreModules: ['Tenant Management', 'RBAC & SSO', 'Metered Billing', 'API Keys & Webhooks', 'Usage Analytics'],
    defaultRoles: ['Platform Owner', 'Tenant Admin', 'Developer', 'Billing Viewer'],
    samplePrompt:
      'Architect a multi-tenant B2B SaaS control plane with metered billing, RBAC, and webhook retries using Python FastAPI.',
  },
  {
    id: 'tpl-healthcare',
    category: 'Healthcare Store Management',
    title: 'Healthcare & Pharmacy Store ERP',
    summary:
      'Batch & expiry tracking, prescription verification, cold-chain compliance alerts, and patient billing.',
    defaultLanguage: 'C#',
    defaultThemeId: 'hc-aqua-clinical',
    coreModules: ['Rx Verification', 'Batch & Expiry Ledger', 'Cold-Chain Alerts', 'Supplier Reorder', 'Patient Billing'],
    defaultRoles: ['Chief Pharmacist', 'Dispensing Tech', 'Compliance Auditor', 'Cashier'],
    samplePrompt:
      'Design a pharmacy & healthcare store system with batch expiration FEFO alerts and prescription audit trails in C# .NET 9.',
  },
  {
    id: 'tpl-custom',
    category: 'Custom Business Applications',
    title: 'Custom Enterprise Workflow App',
    summary:
      'Describe any domain model, approval workflow, ledger, or operational portal in natural language.',
    defaultLanguage: 'Python',
    defaultThemeId: 'saas-aurora-ai',
    coreModules: ['Domain Entities', 'Workflow Engine', 'Role Permissions', 'Audit Trail', 'Reporting Export'],
    defaultRoles: ['System Admin', 'Operations Manager', 'Reviewer', 'Operator'],
    samplePrompt:
      'Build a fleet maintenance and vendor procurement portal with approval workflows and audit logs using PHP Laravel.',
  },
];

export interface AgentDefinition {
  id: AgentNodeId;
  name: string;
  role: string;
}

export const LANGGRAPH_AGENTS: AgentDefinition[] = [
  { id: 'intent', name: 'Intent Agent', role: 'Parses domain, target language, and modification scope' },
  { id: 'requirement', name: 'Requirement Analysis Agent', role: 'Extracts modules, user roles, and business rules' },
  { id: 'architect', name: 'Architect Agent', role: 'Selects service topology, layers, and prompt packs' },
  { id: 'uiux', name: 'UI/UX Agent', role: 'Binds decoupled Glass UI design tokens without mutating logic' },
  { id: 'database', name: 'Database Agent', role: 'Generates normalized PostgreSQL schemas and migrations' },
  { id: 'backend', name: 'Backend Agent', role: 'Generates idiomatic API controllers, services, and models' },
  { id: 'frontend', name: 'Frontend Agent', role: 'Builds typed React/Vue views bound to CSS token variables' },
  { id: 'security', name: 'Security Agent', role: 'Verifies JWT/RBAC, tenant isolation, and input validation' },
  { id: 'testing', name: 'Testing Agent', role: 'Generates unit and integration test suites' },
  { id: 'update', name: 'Update Agent', role: 'Computes deterministic AST/file diffs against Project Memory' },
  { id: 'export', name: 'Export Agent', role: 'Packages clean repository bundles and Dockerfiles' },
];

export const PROMPT_LAYERS: PromptLayer[] = [
  'Platform Core Prompts',
  'Security Prompts',
  'Application Template Prompts',
  'Module Prompts',
  'Language Prompts',
  'Project Prompts',
  'Change Prompts',
  'Testing Prompts',
  'Deployment Prompts',
];
