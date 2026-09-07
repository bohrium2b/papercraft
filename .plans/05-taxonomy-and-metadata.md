# Taxonomy & Metadata Engine Plan

## Feature Intent

Every exam item in Papercraft is tagged with structured metadata so that it can be found, filtered, and assembled algorithmically. The taxonomy engine lets departments map items to their curriculum hierarchy — from syllabus board down to specific learning outcomes — and classify them by cognitive demand using configurable frameworks like Bloom's Revised or Webb's DOK.

When a teacher searches the Question Bank for "Differentiation - Chain Rule, difficulty 5-8, 4 marks, Bloom Apply", the system returns exactly those items. When the Blueprint Engine assembles a paper, it uses the same taxonomy to ensure topic coverage and cognitive balance. The metadata is not an afterthought; it is the connective tissue between authoring, search, assembly, and analytics.

Departments configure their own cognitive frameworks as JSONB, so a Cambridge Maths department can use MAB classifications while an NCEA Physics department uses AME — no code deploy required.

## Curriculum Hierarchy Model

### Taxonomy Tables
```ruby
class SyllabusBoard < ApplicationRecord
  belongs_to :organization
  has_many :subjects
  # columns: name, exam_board (string, e.g. "Cambridge", "NCEA", "AQA")
end

class Subject < ApplicationRecord
  belongs_to :syllabus_board
  has_many :grade_levels
end

class GradeLevel < ApplicationRecord
  belongs_to :subject
  has_many :courses
end

class Course < ApplicationRecord
  belongs_to :grade_level
  has_many :units
  # columns: name, code
end

class Unit < ApplicationRecord
  belongs_to :course
  has_many :sub_topics
end

class SubTopic < ApplicationRecord
  belongs_to :unit
  has_many :learning_outcomes
end

class LearningOutcome < ApplicationRecord
  belongs_to :sub_topic
  # columns: description, code
end
```

Taxonomy is **per-institution** (shared across departments within an organization for curriculum consistency), but departments choose which levels to use and can maintain their own local tags.

### Cognitive Frameworks (Department-Configurable)
```ruby
class CognitiveFramework < ApplicationRecord
  belongs_to :department
  # columns: name (e.g. "Bloom's Revised", "Webb's DOK", "Custom"), levels (jsonb)
  # Example levels: [{"code":1,"label":"Remember","description":"..."}, ...]
end
```

Instead of fixed Bloom/DOK enums, each department defines its own cognitive framework as JSONB. The item editor renders a dropdown of the department's configured levels. This allows Maths (Cambridge) to use MAB classifications while Physics (NCEA) uses AME, without code changes.

### Item Taxonomy Assignment
```ruby
class ItemTaxonomy < ApplicationRecord
  belongs_to :item
  belongs_to :learning_outcome, optional: true
  belongs_to :cognitive_framework, optional: true
  # columns: bloom_level (int, optional), dok_level (int, optional),
  #          difficulty_nominal (int 1-10), estimated_minutes (int)
  # bloom_level and dok_level are integers matching the department's framework level codes.
  # They are not foreign keys to a fixed table — they reference the department's JSONB config.
end
```

## Item Type Taxonomy
Item types are stored as a string column on `Item` (`item_type`) with a department-level allowlist configured in JSONB. No enum constraint at the database level.

## Metadata UI (MUI)
- **Autocomplete** fields for curriculum hierarchy selection
- **Slider** for difficulty nominal (1-10)
- **Chip** display for selected tags
- **Cognitive level selector:** dropdown populated from the department's `CognitiveFramework#levels`
- **Validation:** at least 1 learning outcome required before approval

## Search Index
- **PostgreSQL full-text search** with `pg_trgm` for fuzzy matching
- GIN index on `items.title`, `items.prompt_text`, `tags`
- `content_hash` index for duplication detection
- Simple usage counter per item (denormalised `usage_count` column, refreshed by background job)

## Storage Impact
- Taxonomy tables: ~50KB per department
- ItemTaxonomy rows: ~200 bytes per item
- CognitiveFramework JSONB: ~2KB per department
- 1000 items × 200 bytes = 200KB (negligible)
