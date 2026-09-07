# Question Bank & Approval Workflows Plan

## Feature Intent

The Question Bank is the governed repository where approved exam items live. Authors create drafts, submit them for review, and track them through a formal lifecycle: Draft → Pending Review → Revisions Requested → Approved → Archived. Senior Examiners review items for content accuracy, mark allocations, and taxonomy tagging before they become eligible for exam assembly.

The bank explorer is a searchable, filterable grid where users can find items by subject, unit, difficulty, status, marks, author, or keyword. Bulk actions let departments add items to blueprints, archive deprecated questions, or update tags in one operation. Every approved item is version-snapshot at submission and approval, so the exact wording used in a published exam is locked forever — even if the source item is later edited.

## Data Model

### Item Versioning
```ruby
class Item < ApplicationRecord
  belongs_to :department
  belongs_to :author, class_name: "User"
  belongs_to :parent, class_name: "Item", optional: true
  has_many  :children, class_name: "Item", foreign_key: "parent_id", dependent: :destroy

  enum node_type: { stimulus: 0, question: 1, subpart: 2 }
  enum status:    { draft: 0, pending_review: 1, revisions_requested: 2, approved: 3, archived: 4 }

  # columns: title, stimulus_html (text), prompt_html (text),
  #          marks (int), estimated_minutes (int),
  #          is_parameterizable (boolean), item_type (string),
  #          difficulty_nominal (int 1-10), irt_params (jsonb, optional),
  #          content_hash (string), usage_count (int, denormalised)

  has_many :item_versions, dependent: :destroy
  has_many :item_taxonomies, dependent: :destroy
  has_many :item_layout_rules, dependent: :destroy
  has_one_attached :stimulus_image
end

class ItemVersion < ApplicationRecord
  belongs_to :item
  # columns: version_string, snapshot_json (jsonb), created_at
  # Full tree snapshot only.
end

class ItemRevisionTransition < ApplicationRecord
  belongs_to :item
  belongs_to :reviewer, class_name: "User", optional: true
  # columns: from_status, to_status, comment, created_at
end
```

### Approval Workflow State Machine
```ruby
class Item < ApplicationRecord
  include AASM

  aasm column: :status do
    state :draft, initial: true
    state :pending_review
    state :revisions_requested
    state :approved
    state :archived

    event :submit_for_review do
      transitions from: :draft, to: :pending_review, after: :snapshot_version
    end

    event :request_revisions do
      transitions from: :pending_review, to: :revisions_requested
    end

    event :approve do
      transitions from: [:pending_review, :revisions_requested], to: :approved, after: :snapshot_version
    end

    event :archive do
      transitions from: :approved, to: :archived
    end
  end

  private

  def snapshot_version
    item_versions.create!(
      version_string: "#{item_versions.count + 1}.0",
      snapshot_json: serialize_tree
    )
  end

  def serialize_tree
    {
      item: self.attributes.slice("id", "title", "stimulus_html", "prompt_html", "marks", ...),
      children: children.map { |c| { item: c.attributes.slice(...), children: [] } }
    }
  end
end
```

Snapshots are created on `submit_for_review` and `approve`. The reviewer sees the snapshot that existed at submission time, not the live draft.

## Item Bank Explorer (React)

### MUI Data Grid
- **Columns:** ID, Title, Prompt preview, Metadata, Status, Version, Usage count, Actions
- **Filtering:** Subject, Unit, Difficulty, Status, Tags, Marks, Author, Item type
- **Sorting:** Created at, Difficulty, Marks, Usage count
- **Pagination:** Offset-based, 50 per page (data scale doesn't warrant cursor pagination)
- **Bulk actions:** Add to blueprint, Archive, Tag update

### Actions
- **Add to Exam:** Modal to select exam + section
- **Edit:** Opens ItemEditor with current item data (acquires tree lock)
- **History:** Version diff viewer (JSON comparison between snapshots)
- **Review:** Opens approval panel with comment thread

## Versioning Strategy
- **Snapshot on submit_for_review and approve:** Full item tree JSON stored in `item_versions`
- **Immutable history:** No updates to old versions
- **Paper lock:** Exam assembly stores `item_version_id` reference
- **Edits to approved items:** Create new draft version; old version remains locked

## Usage Metrics
- `usage_count` denormalised counter on `Item`, refreshed by background job
- `ItemUsage` join table records which exams use which item versions (for exclusion rules in assembly)
- Prevent reuse in last N exams (configurable cooldown)

## Permissions
| Role | View | Edit Own Draft | Submit Review | Approve | Archive |
|------|------|---------------|---------------|---------|---------|
| Item Author | Any | Own | Own | can_approve only | - |
| Senior Examiner | Any | Any draft | Any | can_approve only | - |
| Dept Admin | Any | Any | Any | can_approve only | can_approve only |
| Auditor | Read-only | - | - | - | - |

Approval is gated by the `can_approve` boolean on `UserDepartment`, not by role. Any user with `can_approve = true` can approve items across all departments in their organization.

## Locking
- Editing an item acquires a tree lock (item + all descendants)
- Editing a blueprint acquires a tree lock (blueprint + all referenced items)
- Viewing a locked resource is always allowed
- Lock TTL: 2 hours (prevents stale locks from crashed sessions)

## Storage Impact
- **Item versions:** ~50KB per version × 10 versions per item × 1000 items = 500MB
- **ItemRevisionTransition:** ~100 bytes per transition × 1000 items = 100KB
- **Usage counters:** negligible (int column)
