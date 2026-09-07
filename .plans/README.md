# Papercraft Exam Authoring Platform — Implementation Plans

## What This Platform Does

Papercraft is a multi-tenant exam authoring and publishing engine for schools, examination boards, and educational networks. It replaces scattered spreadsheets, shared drives, and manual Word documents with a single governed system for the entire offline paper-based assessment lifecycle.

Authors build rich, mathematically precise exam items in a distraction-free WYSIWYG editor with inline LaTeX math, vector diagramming, and structured multi-part question trees. Senior examiners govern these items through a formal moderation queue, version-controlled approval workflow, and exposure tracking so the same question is never overused.

Once approved, items live in a searchable, taxonomy-rich Question Bank. Blueprint-driven assembly — backed by a constraint solver — automatically matches questions to topic weightings, mark targets, difficulty curves, and cognitive-level distributions. Authors can also assemble papers manually with a live compliance matrix that warns of coverage gaps in real time.

The platform then compiles print-ready PDFs: A4 question papers with configurable ruled response spaces, answer lines, and pagination guards; matching mark schemes with taxonomic classification tables (M/A/B/DM/FT/C); and branded cover sheets built in a visual drag-and-drop template designer. For large exam halls, a deterministic variant engine generates parallel versions (A/B/C) with isomorphic substitutions and parameterised mutations, validated by an equivalence audit matrix.

An embedded AI assistant — split between in-browser grammar checks and external generation — helps authors draft questions, generate worked solutions, and run ambiguity checks. Every step is governed by RBAC, locked by pessimistic tree locks, and traced through lightweight approval transitions.

The entire system is designed to run on a single 2 GB / 13 GB host serving up to 20 concurrent users, with serialized PDF/Latex compilation, streamed Prawn output, and aggressive caching to stay inside that envelope.

## Platform Overview
Multi-tenant exam authoring, blueprinting, and publishing engine for educational institutions. Offline, paper-based assessment lifecycle management from item construction through algorithmic assembly to mark scheme generation.

## Technology Stack
- **Backend:** Ruby on Rails 8.x (API + Server-Rendered Admin)
- **Frontend:** React 18 + TypeScript + Vite + MUI v6
- **Database:** PostgreSQL 16
- **Background Processing:** Sidekiq (minimal concurrency)
- **PDF/Typesetting:** Prawn + LaTeX (restricted concurrency)
- **Vector Graphics:** dvisvgm + TikZ/PGF compilation
- **Cache/Store:** Redis (lightweight, single instance)
- **Authentication:** Sorcery + SAML/OIDC via omniauth
- **Constraint Solver:** Google OR-Tools CP-SAT (ruby-or-tools gem)

## Key Architectural Decisions
- **No RBAC** — department is a metadata label, not a security boundary. `can_approve` boolean on UserDepartment is the only permission flag.
- **Self-referential Item tree** — Item, ItemPart, and ItemSubPart are a single `Item` model with `parent_id` self-reference and `node_type` enum.
- **Whole-tree snapshots** — `ItemVersion` stores the full item tree as a single JSONB blob on `submit_for_review` and `approve`.
- **Tree-level pessimistic locking** — locking a resource locks its entire descendant tree. Viewing is always allowed; writing is gated.
- **Deterministic variant generation only** — no LLM calls for variants. Three strategies: structural permutation, isomorphic substitution, dynamic parameterization.
- **Department-configurable mark schemes** — classification codes, column layouts, and rubric bands are JSONB config on `Department`, not code enums.
- **AI split by trust boundary** — in-browser transformer.js (0.6B) for simple autosave checks; external API (OpenAI/Anthropic) only on explicit user action for generation and QA.
- **Single PdfKit module** — all PDF compilation (cover sheets, question papers, mark schemes) shares one Prawn-based rendering toolkit.

## Strict Server Resource Constraints
- **Memory:** 2 GB RAM
- **Storage:** 13 GB disk
- **Concurrency:** Up to 20 simultaneous users

### Resource Budget
| Component | Memory Target | Notes |
|-----------|--------------|-------|
| Rails App (Puma) | 512 MB | 2 workers, threads 2:2 |
| PostgreSQL | 256 MB | shared_buffers=128MB, work_mem=4MB |
| Redis | 64 MB | maxmemory 64MB, allkeys-lru, DB 0 = sessions+Sidekiq, DB 1 = SVG cache |
| Sidekiq | 128 MB | 1 concurrency |
| OS / Misc | 256 MB | |
| Headroom | 784 MB | for PDF/Latex burst |
| **Total** | **~1.9 GB** | |

### Storage Target
| Target | Size |
|--------|------|
| OS + Rails app | 3 GB |
| PostgreSQL data | 4 GB |
| Redis persistence | 1 GB |
| Compiled PDFs / SVG cache | 3 GB |
| Uploaded assets / images | 2 GB |
| **Total** | **~13 GB** |

---

## File Organization

```
.plans/
├── README.md
├── 01-infrastructure-and-performance.md
├── 02-multi-tenant-and-auth.md
├── 03-item-authoring-engine.md
├── 04-diagramming-and-latex.md
├── 05-taxonomy-and-metadata.md
├── 06-ai-authoring-and-qa.md
├── 07-question-bank-and-workflows.md
├── 08-exam-assembly-and-blueprints.md
├── 09-variant-generation.md
├── 10-cover-sheet-and-templates.md
├── 11-print-and-pagination.md
├── 12-mark-scheme-engine.md
├── 13-analytics-and-reporting.md
├── 14-security-and-compliance.md
└── 15-implementation-calendar.md
```
