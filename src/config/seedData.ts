import { AuditLogEntry, Project, SupportTicket } from '../types/project';
import { PromptEntry } from '../types/prompt';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-hrms-aurora',
    name: 'Vanguard People HRMS',
    description:
      'Enterprise workforce management platform covering employee records, biometric attendance, automated payroll, and multi-tier leave approvals.',
    category: 'HRMS',
    themeCategory: 'HRMS',
    language: 'Java',
    framework: 'Spring Boot',
    frontendFramework: 'React + TypeScript',
    database: 'PostgreSQL',
    authMethod: 'JWT + RBAC',
    version: 'v1.2.0',
    status: 'Active',
    themeId: 'hrms-aurora-hr',
    modules: ['Employee', 'Attendance', 'Payroll', 'Leave'],
    shareToken: 'shr_hrms_92a8c1f0',
    shareEnabled: true,
    createdAt: '2026-10-28T09:15:00Z',
    updatedAt: '2026-11-10T14:22:00Z',
    collaborators: [
      {
        id: 'col-1',
        name: 'Charan Ariga',
        email: 'arigasaicharan@gmail.com',
        role: 'Owner',
        invitedAt: '2026-10-28T09:15:00Z',
      },
      {
        id: 'col-2',
        name: 'Meera Nair',
        email: 'meera.nair@vanguard.io',
        role: 'Editor',
        invitedAt: '2026-11-02T11:30:00Z',
      },
    ],
    memory: {
      specification:
        'Modular HRMS built on Java 21 + Spring Boot 3.4 with PostgreSQL persistence, JWT authentication, and decoupled Glass UI design tokens.',
      userRoles: ['HR Admin', 'Payroll Manager', 'Department Lead', 'Employee'],
      businessRules: [
        'Leave requests exceeding 3 consecutive days require Department Lead + HR Admin dual approval.',
        'Payroll batch execution locks attendance records for the active pay period.',
        'Employees can view only their own payslips and leave balances (tenant + owner isolation).',
      ],
      databaseSchema: [
        {
          name: 'employees',
          columns: [
            { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
            { name: 'employee_code', type: 'VARCHAR(32)', constraints: 'UNIQUE NOT NULL' },
            { name: 'full_name', type: 'VARCHAR(160)', constraints: 'NOT NULL' },
            { name: 'department', type: 'VARCHAR(80)', constraints: 'NOT NULL' },
            { name: 'base_salary_cents', type: 'BIGINT', constraints: 'NOT NULL' },
          ],
        },
        {
          name: 'leave_requests',
          columns: [
            { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
            { name: 'employee_id', type: 'UUID', constraints: 'REFERENCES employees(id)' },
            { name: 'start_date', type: 'DATE', constraints: 'NOT NULL' },
            { name: 'end_date', type: 'DATE', constraints: 'NOT NULL' },
            { name: 'status', type: 'VARCHAR(24)', constraints: 'DEFAULT PENDING' },
          ],
        },
      ],
      apiDefinitions: [
        { method: 'GET', path: '/api/v1/employees', summary: 'Paginated employee directory with department filters', authRequired: true },
        { method: 'POST', path: '/api/v1/attendance/check-in', summary: 'Record shift check-in timestamp', authRequired: true },
        { method: 'POST', path: '/api/v1/payroll/runs', summary: 'Execute monthly payroll calculation batch', authRequired: true },
        { method: 'PATCH', path: '/api/v1/leaves/{id}/decision', summary: 'Approve or reject leave request', authRequired: true },
      ],
      acceptedChangeIds: ['chg-001', 'chg-002'],
      promptHistory: [
        'Build an HRMS application with employee management, attendance, payroll, and leave management. Use Java Spring Boot.',
        'Add dual-approval business rule for leave requests longer than 3 days.',
      ],
    },
    files: [
      {
        path: 'backend/src/main/java/com/aegion/hrms/controller/EmployeeController.java',
        language: 'java',
        summary: 'Spring Boot REST controller for Employee directory & onboarding',
        content: `package com.aegion.hrms.controller;

import com.aegion.hrms.dto.EmployeeResponse;
import com.aegion.hrms.service.EmployeeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'DEPARTMENT_LEAD')")
    public Page<EmployeeResponse> listEmployees(
            @RequestParam(required = false) String department,
            Pageable pageable) {
        return employeeService.findAll(department, pageable);
    }
}`,
      },
      {
        path: 'backend/src/main/resources/db/migration/V1__init_hrms.sql',
        language: 'sql',
        summary: 'PostgreSQL schema migration for employees, attendance, payroll, and leave',
        content: `CREATE TABLE employees (
    id UUID PRIMARY KEY,
    employee_code VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    department VARCHAR(80) NOT NULL,
    base_salary_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    approver_id UUID REFERENCES employees(id)
);`,
      },
      {
        path: 'frontend/src/styles/theme-tokens.css',
        language: 'css',
        summary: 'Decoupled Glass UI design tokens independent of business logic',
        content: `:root {
  --app-bg: #F7F5FF;
  --app-surface: #FFFFFF;
  --app-accent: #7C3AED;
  --app-glass-opacity: 0.84;
  --app-blur: 14px;
  --app-radius: 12px;
}`,
      },
    ],
    versions: [
      {
        id: 'ver-101',
        version: 'v1.0.0',
        createdAt: '2026-10-28T09:15:00Z',
        author: 'Charan Ariga',
        changeSummary: 'Initial Java Spring Boot HRMS scaffold with Employee & Attendance modules',
        language: 'Java',
        framework: 'Spring Boot',
        themeId: 'hrms-pearl-workforce',
        modules: ['Employee', 'Attendance'],
        files: [],
        status: 'approved',
      },
      {
        id: 'ver-102',
        version: 'v1.2.0',
        createdAt: '2026-11-10T14:22:00Z',
        author: 'Charan Ariga',
        changeSummary: 'Added Payroll Engine, Leave dual-approval policy, and Aurora HR glass tokens',
        language: 'Java',
        framework: 'Spring Boot',
        themeId: 'hrms-aurora-hr',
        modules: ['Employee', 'Attendance', 'Payroll', 'Leave'],
        files: [],
        status: 'approved',
      },
    ],
  },
  {
    id: 'proj-saas-pulse',
    name: 'Kestrel Metering SaaS',
    description:
      'Multi-tenant API metering, subscription billing, and webhook delivery platform built with Python FastAPI.',
    category: 'SaaS Applications',
    themeCategory: 'SaaS',
    language: 'Python',
    framework: 'FastAPI',
    frontendFramework: 'React + TypeScript',
    database: 'PostgreSQL',
    authMethod: 'JWT + API Keys',
    version: 'v1.0.0',
    status: 'Deployed',
    themeId: 'saas-cloud-midnight',
    modules: ['Tenant Management', 'Metered Billing', 'API Keys & Webhooks', 'Usage Analytics'],
    shareToken: 'shr_saas_44d19e20',
    shareEnabled: true,
    createdAt: '2026-11-04T12:00:00Z',
    updatedAt: '2026-11-11T16:40:00Z',
    collaborators: [
      {
        id: 'col-3',
        name: 'Charan Ariga',
        email: 'arigasaicharan@gmail.com',
        role: 'Owner',
        invitedAt: '2026-11-04T12:00:00Z',
      },
    ],
    memory: {
      specification:
        'Python FastAPI control plane with SQLAlchemy async models, tenant-scoped rate limits, and real-time webhook retry queue.',
      userRoles: ['Platform Owner', 'Tenant Admin', 'Developer'],
      businessRules: [
        'All tenant queries enforce workspace_id predicate isolation at the repository layer.',
        'Webhook deliveries retry with exponential backoff up to 5 attempts before dead-lettering.',
      ],
      databaseSchema: [
        {
          name: 'tenants',
          columns: [
            { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
            { name: 'slug', type: 'VARCHAR(64)', constraints: 'UNIQUE NOT NULL' },
            { name: 'plan_tier', type: 'VARCHAR(32)', constraints: 'NOT NULL' },
          ],
        },
      ],
      apiDefinitions: [
        { method: 'POST', path: '/api/v1/tenants', summary: 'Provision isolated tenant workspace', authRequired: true },
        { method: 'POST', path: '/api/v1/usage/events', summary: 'Ingest metered usage event', authRequired: true },
      ],
      acceptedChangeIds: ['chg-101'],
      promptHistory: ['Create a multi-tenant B2B SaaS metering control plane with Python FastAPI.'],
    },
    files: [
      {
        path: 'app/api/v1/usage.py',
        language: 'python',
        summary: 'FastAPI metered usage ingestion router',
        content: `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_tenant
from app.schemas.usage import UsageEventCreate, UsageSummary

router = APIRouter(prefix="/usage", tags=["usage"])

@router.post("/events", response_model=UsageSummary)
async def ingest_usage_event(
    payload: UsageEventCreate,
    tenant=Depends(get_current_tenant),
):
    return await usage_service.record_event(tenant.id, payload)`,
      },
    ],
    versions: [
      {
        id: 'ver-201',
        version: 'v1.0.0',
        createdAt: '2026-11-04T12:00:00Z',
        author: 'Charan Ariga',
        changeSummary: 'Initial FastAPI multi-tenant SaaS scaffold',
        language: 'Python',
        framework: 'FastAPI',
        themeId: 'saas-cloud-midnight',
        modules: ['Tenant Management', 'Metered Billing', 'API Keys & Webhooks', 'Usage Analytics'],
        files: [],
        status: 'approved',
      },
    ],
  },
  {
    id: 'proj-healthcare-rx',
    name: 'CareVault Pharmacy ERP',
    description:
      'Clinical pharmacy store management with FEFO batch expiration alerts, prescription verification, and supplier reorder.',
    category: 'Healthcare Store Management',
    themeCategory: 'Healthcare Store',
    language: 'C#',
    framework: '.NET 9 Web API',
    frontendFramework: 'React + TypeScript',
    database: 'PostgreSQL',
    authMethod: 'JWT + Audit Trail',
    version: 'v1.1.0',
    status: 'Active',
    themeId: 'hc-aqua-clinical',
    modules: ['Rx Verification', 'Batch & Expiry Ledger', 'Cold-Chain Alerts', 'Patient Billing'],
    shareToken: 'shr_hc_71b2e019',
    shareEnabled: false,
    createdAt: '2026-11-06T08:30:00Z',
    updatedAt: '2026-11-11T10:15:00Z',
    collaborators: [
      {
        id: 'col-4',
        name: 'Charan Ariga',
        email: 'arigasaicharan@gmail.com',
        role: 'Owner',
        invitedAt: '2026-11-06T08:30:00Z',
      },
    ],
    memory: {
      specification:
        'Healthcare Store ERP using .NET 9 Web API and EF Core with strict FEFO batch dispensing rules and immutable audit logging.',
      userRoles: ['Chief Pharmacist', 'Dispensing Tech', 'Compliance Auditor'],
      businessRules: [
        'Controlled substances cannot be dispensed without pharmacist verification signature.',
        'Inventory picks automatically select earliest non-expired batch (FEFO).',
      ],
      databaseSchema: [
        {
          name: 'medication_batches',
          columns: [
            { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
            { name: 'lot_number', type: 'VARCHAR(64)', constraints: 'NOT NULL' },
            { name: 'expires_on', type: 'DATE', constraints: 'NOT NULL' },
            { name: 'quantity_on_hand', type: 'INTEGER', constraints: 'NOT NULL' },
          ],
        },
      ],
      apiDefinitions: [
        { method: 'GET', path: '/api/v1/batches/expiring', summary: 'List batches expiring within 30 days', authRequired: true },
        { method: 'POST', path: '/api/v1/prescriptions/verify', summary: 'Verify and dispense prescription batch', authRequired: true },
      ],
      acceptedChangeIds: ['chg-301'],
      promptHistory: ['Build a Healthcare Store ERP with FEFO expiry alerts in C# .NET 9.'],
    },
    files: [
      {
        path: 'Controllers/PrescriptionsController.cs',
        language: 'csharp',
        summary: '.NET 9 endpoint for pharmacist verification and FEFO allocation',
        content: `using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/prescriptions")]
[Authorize(Roles = "ChiefPharmacist,DispensingTech")]
public class PrescriptionsController : ControllerBase
{
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyRxRequest request)
    {
        return Ok(new { status = "verified", allocationPolicy = "FEFO" });
    }
}`,
      },
    ],
    versions: [
      {
        id: 'ver-301',
        version: 'v1.1.0',
        createdAt: '2026-11-06T08:30:00Z',
        author: 'Charan Ariga',
        changeSummary: 'Added FEFO batch ledger and cold-chain threshold alerts',
        language: 'C#',
        framework: '.NET 9 Web API',
        themeId: 'hc-aqua-clinical',
        modules: ['Rx Verification', 'Batch & Expiry Ledger', 'Cold-Chain Alerts', 'Patient Billing'],
        files: [],
        status: 'approved',
      },
    ],
  },
];

export const INITIAL_PROMPTS: PromptEntry[] = [
  {
    id: 'PRM-CORE-001',
    name: 'Aegion LangGraph Orchestration Core',
    layer: 'Platform Core Prompts',
    language: 'All',
    applicationType: 'All',
    module: 'Orchestrator',
    version: 'v3.2.0',
    previousVersion: 'v3.1.0',
    status: 'Approved',
    protected: true,
    author: 'Platform Architecture Team',
    changeDescription: 'Enforce strict decoupling between Glass UI CSS variables and generated business logic.',
    content:
      'SYSTEM CORE: Orchestrate Intent, Requirement, Architect, UI/UX, Database, Backend, Frontend, Security, and Testing agents. Always bind UI components to semantic CSS design tokens (--app-bg, --app-surface, --app-accent) so theme switching never mutates business logic.',
    previousContent:
      'SYSTEM CORE: Orchestrate Intent, Architect, Code, and Security agents. Generate clean layered code.',
    approvalHistory: [
      {
        version: 'v3.2.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-08T10:00:00Z',
        note: 'Verified token decoupling across 50 Glass UI presets.',
      },
      {
        version: 'v3.1.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-10-19T16:45:00Z',
        note: 'Initial production graph contract.',
      },
    ],
    updatedAt: '2026-11-08T10:00:00Z',
  },
  {
    id: 'PRM-SEC-001',
    name: 'Zero-Trust Isolation & Sandbox Guard',
    layer: 'Security Prompts',
    language: 'All',
    applicationType: 'All',
    module: 'Security',
    version: 'v2.4.0',
    previousVersion: 'v2.3.0',
    status: 'Approved',
    protected: true,
    author: 'Security Engineering',
    changeDescription: 'Added mandatory parameterized query checks and isolated container execution boundaries.',
    content:
      'SECURITY GUARD: Enforce RBAC middleware on every mutating route, tenant_id row scoping, zero hardcoded secrets, and isolated Docker runtime execution for generated artifacts.',
    previousContent:
      'SECURITY GUARD: Enforce JWT validation and parameterized database queries on all endpoints.',
    approvalHistory: [
      {
        version: 'v2.4.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-05T09:30:00Z',
        note: 'Passed OWASP API Top-10 prompt checklist.',
      },
    ],
    updatedAt: '2026-11-05T09:30:00Z',
  },
  {
    id: 'PRM-TPL-HRMS',
    name: 'Enterprise HRMS Domain Pack',
    layer: 'Application Template Prompts',
    language: 'All',
    applicationType: 'HRMS',
    module: 'Core Domain',
    version: 'v1.5.0',
    previousVersion: 'v1.4.0',
    status: 'Approved',
    protected: false,
    author: 'Charan Ariga',
    changeDescription: 'Added payroll period locking and multi-level leave escalation rules.',
    content:
      'HRMS DOMAIN PACK: Model Employees, Departments, Attendance Logs, Payroll Runs, and Leave Requests with immutable audit timestamps and role-based salary visibility.',
    previousContent:
      'HRMS DOMAIN PACK: Model Employees, Attendance Logs, Payroll Runs, and Leave Requests.',
    approvalHistory: [
      {
        version: 'v1.5.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-09T14:10:00Z',
        note: 'Validated against Vanguard People HRMS project.',
      },
    ],
    updatedAt: '2026-11-09T14:10:00Z',
  },
  {
    id: 'PRM-LANG-JAVA',
    name: 'Java 21 + Spring Boot 3.4 Pack',
    layer: 'Language Prompts',
    language: 'Java',
    applicationType: 'All',
    module: 'Backend Adapter',
    version: 'v2.1.0',
    previousVersion: 'v2.0.0',
    status: 'Approved',
    protected: false,
    author: 'Backend Guild',
    changeDescription: 'Upgraded to Java 21 records for DTOs and Flyway PostgreSQL migrations.',
    content:
      'JAVA SPRING PACK: Generate Controller -> Service -> Repository layers, Java 21 record DTOs, @PreAuthorize RBAC guards, Flyway SQL migrations, and JUnit 5 tests.',
    previousContent:
      'JAVA SPRING PACK: Generate Controller -> Service -> Repository layers with Spring Data JPA.',
    approvalHistory: [
      {
        version: 'v2.1.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-07T11:20:00Z',
        note: 'Confirmed compatibility with Spring Boot 3.4.',
      },
    ],
    updatedAt: '2026-11-07T11:20:00Z',
  },
  {
    id: 'PRM-LANG-PY',
    name: 'Python 3.12 + FastAPI Pack',
    layer: 'Language Prompts',
    language: 'Python',
    applicationType: 'All',
    module: 'Backend Adapter',
    version: 'v2.3.0',
    status: 'Approved',
    protected: false,
    author: 'Core Python Team',
    changeDescription: 'Async SQLAlchemy 2.0 repositories with Pydantic v2 validation.',
    content:
      'PYTHON FASTAPI PACK: Use async APIRouter endpoints, Pydantic v2 BaseModel schemas, SQLAlchemy 2.0 mapped_column models, Alembic migrations, and pytest async fixtures.',
    approvalHistory: [
      {
        version: 'v2.3.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-10T08:00:00Z',
        note: 'Default backend generation pack.',
      },
    ],
    updatedAt: '2026-11-10T08:00:00Z',
  },
  {
    id: 'PRM-LANG-PHP',
    name: 'PHP 8.3 + Laravel 11 Pack',
    layer: 'Language Prompts',
    language: 'PHP',
    applicationType: 'All',
    module: 'Backend Adapter',
    version: 'v1.3.0',
    status: 'Draft',
    protected: false,
    author: 'Charan Ariga',
    changeDescription: 'Added Laravel Sanctum token scoping and Vue 3 Inertia adapter.',
    content:
      'PHP LARAVEL PACK: Generate Eloquent models, FormRequest validators, Policy authorization classes, API Resources, and Pest feature tests.',
    approvalHistory: [],
    updatedAt: '2026-11-11T15:00:00Z',
  },
  {
    id: 'PRM-MOD-PAY',
    name: 'Payroll Calculation & Tax Ledger Module',
    layer: 'Module Prompts',
    language: 'All',
    applicationType: 'HRMS',
    module: 'Payroll',
    version: 'v1.2.0',
    status: 'Pending Review',
    protected: false,
    author: 'Meera Nair',
    changeDescription: 'Added overtime multiplier and statutory deduction breakdown.',
    content:
      'PAYROLL MODULE: Compute gross pay, overtime hours from approved attendance logs, statutory deductions, and generate immutable payslip snapshots.',
    approvalHistory: [],
    updatedAt: '2026-11-11T17:45:00Z',
  },
  {
    id: 'PRM-TEST-001',
    name: 'Contract & Integration Test Generator',
    layer: 'Testing Prompts',
    language: 'All',
    applicationType: 'All',
    module: 'QA Suite',
    version: 'v1.4.0',
    status: 'Approved',
    protected: false,
    author: 'QA Architecture',
    changeDescription: 'Include negative RBAC 403 assertions for every generated endpoint.',
    content:
      'TESTING PROMPT: Generate happy-path CRUD tests, schema validation failure tests (422), and unauthorized/forbidden role tests (401/403) in the target language test runner.',
    approvalHistory: [
      {
        version: 'v1.4.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-03T13:10:00Z',
        note: 'Verified across Python, Java, and Go.',
      },
    ],
    updatedAt: '2026-11-03T13:10:00Z',
  },
  {
    id: 'PRM-DEP-001',
    name: 'Isolated Cloud Run Container Pack',
    layer: 'Deployment Prompts',
    language: 'All',
    applicationType: 'All',
    module: 'Containers',
    version: 'v1.1.0',
    status: 'Approved',
    protected: false,
    author: 'Infra Team',
    changeDescription: 'Non-root container user and multi-stage build optimization.',
    content:
      'DEPLOYMENT PROMPT: Produce non-root multi-stage Dockerfiles, healthcheck endpoints, and environment variable templates without embedding secrets.',
    approvalHistory: [
      {
        version: 'v1.1.0',
        approvedBy: 'arigasaicharan@gmail.com',
        approvedAt: '2026-11-01T11:00:00Z',
        note: 'Standardized Cloud Run container spec.',
      },
    ],
    updatedAt: '2026-11-01T11:00:00Z',
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2041',
    subject: 'Custom Spring Boot multi-datasource prompt pack',
    category: 'Code Generation',
    priority: 'High',
    status: 'In Review',
    message: 'Need read-replica routing configuration included in the Java Spring Boot HRMS pack.',
    userEmail: 'meera.nair@vanguard.io',
    createdAt: '2026-11-11T09:15:00Z',
  },
  {
    id: 'TKT-2038',
    subject: 'Cloud Run Python FastAPI CORS origin setup',
    category: 'Deployment',
    priority: 'Standard',
    status: 'Resolved',
    message: 'Confirmed ALLOWED_ORIGINS env variable wiring between AI Studio preview URL and FastAPI backend.',
    userEmail: 'arigasaicharan@gmail.com',
    createdAt: '2026-11-09T14:40:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-11-12T08:12:00Z',
    actorEmail: 'arigasaicharan@gmail.com',
    actorRole: 'super_admin',
    action: 'APPROVE_PROMPT_VERSION',
    target: 'PRM-CORE-001 (v3.2.0)',
    outcome: 'Allowed',
  },
  {
    id: 'AUD-902',
    timestamp: '2026-11-12T09:05:00Z',
    actorEmail: 'meera.nair@vanguard.io',
    actorRole: 'builder',
    action: 'EDIT_PROTECTED_PROMPT',
    target: 'PRM-SEC-001',
    outcome: 'Denied',
  },
  {
    id: 'AUD-903',
    timestamp: '2026-11-12T10:30:00Z',
    actorEmail: 'arigasaicharan@gmail.com',
    actorRole: 'super_admin',
    action: 'EXPORT_PROJECT_ZIP',
    target: 'Vanguard People HRMS (v1.2.0)',
    outcome: 'Allowed',
  },
];
