# Implementation Calendar

## Delivery Philosophy

Papercraft is delivered in seven sequential phases over 20 weeks. Each phase produces a testable, deployable increment. Early phases establish the authoring foundation (items, diagrams, taxonomy); middle phases add assembly and print; late phases add AI, analytics, and hardening.

No phase depends on a future phase being complete. The critical path is linear: you cannot assemble exams without approved items, and you cannot compile PDFs without assembled exams. Variant generation and mark schemes both depend on Phase 4, so they are bundled together in Phase 5.

Risk is front-loaded: the hardest technical challenges (LaTeX OOM, solver timeout, PDF memory spikes) are addressed in Phases 2 and 4 with serialised queues, timeouts, and streamed output. By the time Phase 7 runs performance testing, the system's resource envelope is already proven.

## Phased Delivery (MVP First, then Expand)

### Phase 0: Foundation (Weeks 1-2)
**Goal:** Deployable skeleton with auth, tenancy, item tree CRUD, and locking.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| Rails app setup + Docker Compose (Postgres, Redis, Nginx) | Backend | 8 | P0 |
| Organization + Department models + seeds | Backend | 4 | P0 |
| User model + Sorcery authentication (email/password) | Backend | 6 | P0 |
| UserDepartment join table (can_approve flag) | Backend | 2 | P0 |
| Vite + React + MUI frontend scaffold | Frontend | 6 | P0 |
| Self-referential Item model (tree structure) | Backend | 6 | P0 |
| ItemVersion + ItemRevisionTransition models | Backend | 4 | P0 |
| Lock model + tree lock service | Backend | 6 | P0 |
| ItemRevisionTransition callbacks (submit, approve, request revisions) | Backend | 4 | P0 |
| Department as default view context (no enforcement) | Full-stack | 4 | P0 |

**Deliverable:** Dev environment with multi-org auth, item tree CRUD, locking, and review transitions.

---

### Phase 1: Item Authoring Core (Weeks 3-5)
**Goal:** Functional recursive tree editor with WYSIWYG, math, metadata, and autosave.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| Lexical / TipTap WYSIWYG editor integration | Frontend | 12 | P0 |
| Recursive PartTree editor component (add/remove/reorder) | Frontend | 12 | P0 |
| KaTeX math palette + rendering | Frontend | 8 | P0 |
| Source toggle (raw HTML/LaTeX) | Frontend | 6 | P0 |
| Metadata panel (taxonomy selectors, marks, difficulty) | Frontend | 8 | P0 |
| Image upload + ActiveStorage integration | Full-stack | 4 | P0 |
| Autosave + draft management | Full-stack | 6 | P0 |
| In-browser grammar check (transformer.js 0.6B) | Frontend | 6 | P1 |
| Item validation service (title, parts, marks, taxonomy) | Backend | 4 | P0 |
| Content hash generation for duplication detection | Backend | 2 | P1 |

**Deliverable:** Teachers can create/edit exam items as recursive trees with rich text, math, images, and autosave.

---

### Phase 2: Diagramming & LaTeX (Weeks 6-7)
**Goal:** Dual diagram editor (canvas + TikZ source) and server-side compilation.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| Konva.js canvas editor (shapes, arrows, grid, export SVG) | Frontend | 12 | P0 |
| Monaco TikZ source editor (syntax highlight, error markers) | Frontend | 8 | P0 |
| Server-side pdflatex + dvisvgm job | Backend | 8 | P0 |
| LaTeX security sandbox (sanitization + cgroup + ulimit) | Backend | 6 | P0 |
| SVG caching (Redis DB 1 + disk fallback) | Backend | 4 | P1 |
| Department preamble management | Full-stack | 4 | P1 |
| PdfKit module base (Prawn helpers, watermark, variable injection) | Backend | 8 | P0 |

**Deliverable:** Authors can compose diagrams via canvas or TikZ; compiled SVGs embeddable in items. PdfKit base module established.

---

### Phase 3: Taxonomy & Question Bank (Weeks 8-9)
**Goal:** Full taxonomy hierarchy, cognitive frameworks, searchable item bank, approval workflow.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| SyllabusBoard → Subject → GradeLevel → Course → Unit → SubTopic → LearningOutcome | Backend | 10 | P0 |
| CognitiveFramework model (per-department JSONB config) | Backend | 4 | P0 |
| ItemTaxonomy model + UI panel | Full-stack | 8 | P0 |
| Item bank explorer (MUI DataGrid + filters) | Frontend | 12 | P0 |
| Approval workflow (AASM state machine + snapshot on submit/approve) | Backend | 8 | P0 |
| Version diff viewer (JSON comparison) | Frontend | 6 | P1 |
| Usage counter background job | Backend | 4 | P1 |

**Deliverable:** Curated, searchable, moderated item bank with governance and version history.

---

### Phase 4: Exam Assembly & Blueprints (Weeks 10-12)
**Goal:** Blueprint-driven assembly with OR-Tools CP-SAT solver + manual override.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| Blueprint + BlueprintSection + BlueprintConstraint models | Backend | 8 | P0 |
| OR-Tools CP-SAT constraint solver integration | Backend | 12 | P0 |
| ExamAssemblyService (solver + fallback filter path) | Backend | 10 | P0 |
| Manual assembly UI (drag-drop + metrics panel) | Frontend | 14 | P0 |
| Live compliance matrix (MUI Table + alerts) | Frontend | 8 | P0 |
| Item deduplication + exclusion rules | Backend | 6 | P0 |
| PdfKit::QuestionPaperRenderer (Prawn, pagination, response spaces) | Backend | 14 | P0 |
| PdfKit::CoverSheetRenderer (template rendering, variable injection) | Backend | 8 | P0 |

**Deliverable:** Assembled exams meeting blueprint targets; PDF compilation for question papers and cover sheets.

---

### Phase 5: Variant Generation & Print Engine (Weeks 13-15)
**Goal:** Deterministic variants + mark schemes + full print pipeline.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| ExamVariant model + VariantMutationEngine (3 strategies) | Backend | 10 | P0 |
| Parameter bounds extraction + solution re-render | Backend | 8 | P0 |
| VariantEquivalenceChecker | Backend | 6 | P0 |
| PdfKit::MarkSchemeRenderer (JSONB-driven, department config) | Backend | 10 | P0 |
| MarkScheme model + auto-extraction | Backend | 8 | P0 |
| PartLayoutRule model + UI | Full-stack | 6 | P0 |
| PdfKit::PdfMerger + PdfKit::WatermarkInjector | Backend | 6 | P0 |
| PDF caching + LRU eviction | Backend | 4 | P1 |

**Deliverable:** Multi-variant exams with equivalent metrics; branded cover sheets and mark scheme PDFs.

---

### Phase 6: AI Authoring & QA (Weeks 16-17)
**Goal:** AI-assisted item generation + quality checks.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| AiQuestionGenerator (external API: OpenAI/Anthropic) | Backend | 10 | P0 |
| PromptSanitizer (PII stripping before external API) | Backend | 6 | P0 |
| In-browser transformer.js grammar check bridge | Frontend | 8 | P0 |
| QA pipeline (5 checks orchestrator + Sidekiq batch) | Backend | 10 | P0 |
| Ambiguity check (LLM integration) | Backend | 6 | P0 |
| AI generation modal in item editor | Frontend | 8 | P0 |
| LLM provider abstraction (OpenAI/Anthropic/Ollama adapters) | Backend | 6 | P1 |

**Deliverable:** AI-assisted item authoring with quality scoring; in-browser grammar checks.

---

### Phase 7: Analytics, SSO & Hardening (Weeks 18-20)
**Goal:** Analytics dashboard, SSO, performance testing, production readiness.

| Task | Owner | Est. Hours | Priority |
|------|-------|-----------|----------|
| Analytics dashboard (item bank stats, difficulty histogram, coverage) | Frontend | 12 | P1 |
| Analytics API endpoints | Backend | 6 | P1 |
| SSO integration (SAML + OIDC) | Backend | 10 | P1 |
| Performance testing under 20-user load | Full-stack | 8 | P0 |
| Security audit (rate limiting, CSP, CSRF, headers) | Backend | 6 | P0 |
| Backup + restore testing | Backend | 4 | P0 |
| Compliance documentation (SOC 2 checklist, DPA template) | Docs | 4 | P1 |

**Deliverable:** Production-ready system with SSO, analytics, and compliance controls.

---

## Critical Path
1. Phase 0 → Phase 1 → Phase 2 (authoring foundation)
2. Phase 1 → Phase 3 (taxonomy + bank depend on items)
3. Phase 3 → Phase 4 (assembly needs approved items)
4. Phase 4 → Phase 5 (variants and print depend on assembled exams)
5. Phase 0, 2 → Phase 4 (PdfKit base needed before renderers)
6. Phase 1 → Phase 6 (AI features need item editor)
7. Phase 0, 3, 4, 6 → Phase 7 (analytics needs data, SSO is independent)

## Risk Mitigation
| Risk | Mitigation |
|------|-----------|
| LaTeX OOM kills server | Serialized queue + 30s timeout + 512MB memory limit + Docker cgroup |
| LLM latency blocks UX | Background job + polling + optimistic draft; only on explicit user action |
| PDF generation memory spike | Streamed Prawn output, chunked rendering, 200MB budget per compilation |
| Disk fills up | LRU eviction on PDF cache + asset compression + background cleanup job |
| Lock stale after crash | 2-hour TTL on all locks; automatic expiry |
| Solver timeout on complex blueprints | 5s CP-SAT timeout → fallback to sequential filter approach |
| Cross-org data confusion | No isolation enforced, but department filter is default view; users see own dept first |
