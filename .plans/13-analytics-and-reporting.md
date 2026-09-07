# Analytics & Reporting Plan

## Feature Intent

Papercraft's analytics give departments institutional memory and insight without ingesting any student work. The dashboard surfaces item-bank health (approval rates, difficulty distributions, taxonomy coverage gaps), exam composition metrics (total marks, estimated duration, topic balance), and creation trends over time.

A department head can see at a glance: "We have 1,204 approved items, but only 38% cover Optimisation — that's a critical gap before the end-of-year exam." A Senior Examiner building a paper can see the difficulty histogram of the current item bank and avoid over-reliance on easy or hard questions.

All analytics are computed on-demand from live tables — no materialized views, no background refresh jobs, no storage overhead. The query set is bounded by index on `department_id`, `status`, and `difficulty_nominal`, so even a 1,000-item bank returns dashboard data in under 500 ms.

## Scope

This system does **not** ingest student work. There are no cohorts, no student results, and no longitudinal student analytics. Analytics are limited to **item-level and exam-level aggregates** only.

## Data Model

```ruby
# No new models required. Analytics are computed from existing tables:
# - items (usage_count, difficulty_nominal, item_type)
# - item_versions (snapshot history)
# - item_taxonomies (learning_outcome coverage)
# - exams (assembly status, compilation timestamps)
# - exam_items (position, marks)
```

## Computed Metrics (No Materialized Views)

All analytics are computed on-demand via SQL queries against existing tables. There are no materialized views or background refresh jobs.

### Item Bank Metrics
- **Usage count:** `items.usage_count` (denormalised counter, refreshed by background job)
- **Approval rate:** percentage of items with `status = 'approved'` per department
- **Difficulty distribution:** histogram of `difficulty_nominal` (1-10)
- **Taxonomy coverage:** count of items per `learning_outcome_id`
- **Duplication rate:** count of items with matching `content_hash`

### Exam Metrics
- **Total marks per exam:** sum of `exam_items.marks` or `item.marks`
- **Average difficulty:** weighted average of `item.difficulty_nominal`
- **Duration estimate:** sum of `item.estimated_minutes`
- **Topic coverage matrix:** which learning outcomes are covered by which exams

## React Analytics Dashboard

### MUI Components
```
AnalyticsDashboard
├── DepartmentSelector (Autocomplete)
├── ItemBankStats (MUI Cards: total items, approval rate, avg difficulty)
├── DifficultyHistogram (Chart.js bar chart, 10 bins)
├── TaxonomyCoverage (MUI DataGrid with coverage count per outcome)
├── ExamOverview (MUI Table: exam title, total marks, duration, variant count)
└── UsageTrends (Chart.js line chart, item creation over time)
```

### Chart.js Configuration
- **Histogram:** 10 bins (difficulty 1-10)
- **Coverage table:** X = learning outcome, Y = count of approved items
- **Trend:** X = date, Y = items created per week

## API Endpoints
- `GET /api/v1/analytics/item-bank` — item bank stats for a department
- `GET /api/v1/analytics/exams` — exam metrics for a department
- `GET /api/v1/analytics/taxonomy-coverage` — coverage matrix

## Access Control
- **Read-only:** all authenticated users can view analytics for their organization
- No export functionality in MVP (CSV export is a future enhancement)

## Data Budget
- No materialized views: analytics queries run against live tables
- Expected query time: < 500ms for item bank stats with 1000 items
- Index on `items.department_id`, `items.status`, `items.difficulty_nominal` ensures fast aggregation

## Future: Item Difficulty Modulation
You mentioned optionally modulating item difficulty based on real-world feedback. If implemented later, this would be a simple `observed_difficulty` float column on `Item`, updated by a background job that aggregates exam results. It does not require the analytics scaffolding above — it's a single-column addition to the existing `Item` model.
