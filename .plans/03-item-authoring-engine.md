# Item Authoring Engine & WYSIWYG Editor Plan

## Feature Intent

The Item Authoring Engine is the heart of Papercraft. It lets teachers and examiners build complex, multi-part exam questions — with global stimulus passages, local part-level context, sub-parts, and rich media — without leaving the browser.

A typical authoring session: a teacher opens the question editor, types a physics scenario in the WYSIWYG canvas, drops in a vector diagram of a force triangle, adds a KaTeX-rendered equation, and structures the question into parts (a), (b), (c) with individual mark allocations, response-space heights, and taxonomy tags. They switch to Source view to fine-tune the LaTeX, then hit Save. The item autosaves in the background, a content hash is computed for duplication detection, and the tree is ready for submission to the moderation queue.

The recursive tree model means there is no artificial limit on question depth. A question can have a global stimulus, three parts, and two sub-parts under part (b) — and the editor renders it all in a single scrollable canvas with clear visual hierarchy.

## Data Model

### Self-Referential Item Tree
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
  #          content_hash (string, for duplication detection)

  has_many :item_versions, dependent: :destroy
  has_many :item_taxonomies, dependent: :destroy
  has_many :item_layout_rules, dependent: :destroy
  has_one_attached :stimulus_image
end
```

A top-level item with `parent_id: nil` and `node_type: stimulus` is the question stem. Its children are parts. Grandchildren are sub-parts. There is no fixed depth limit; the editor renders the tree recursively.

### Versioning
```ruby
class ItemVersion < ApplicationRecord
  belongs_to :item
  # columns: version_string (e.g., "1.0"), snapshot_json (jsonb), created_at
  # Full tree snapshot only — no diffs.
end

class ItemRevisionTransition < ApplicationRecord
  belongs_to :item
  belongs_to :reviewer, class_name: "User", optional: true
  # columns: from_status, to_status, comment, created_at
end
```

`ItemVersion#snapshot_json` stores the entire tree rooted at that item as a single JSONB blob:

```json
{
  "item": { "id": 42, "title": "...", "stimulus_html": "...", "marks": 5, ... },
  "children": [
    {
      "item": { "id": 43, "node_type": "question", "prompt_html": "...", "marks": 3, ... },
      "children": [
        { "item": { "id": 44, "node_type": "subpart", "prompt_html": "...", ... }, "children": [] }
      ]
    }
  ]
}
```

Snapshots are created on `submit_for_review` and `approve` transitions.

## Editor UI Architecture

### React Component Tree
```
QuestionEditor
├── EditorToolbar (formatting, math palette, diagram insert, AI assist)
├── StimulusEditor (WYSIWYG)
│   ├── WysiwygPanel (Lexical / TipTap)
│   └── SourcePanel (raw HTML/LaTeX toggle)
├── PartTree
│   ├── PartNode (recursive)
│   │   ├── PromptEditor
│   │   ├── LocalStimulusEditor
│   │   ├── MetadataPanel (tags, marks, taxonomy)
│   │   └── SubPartNode (recursive)
│   └── AddPartButton / AddSubPartButton
├── PreviewPane (MUI Tabs: WYSIWYG | Source | Print Preview)
└── AiAssistant (in-browser grammar check + external AI generation modal)
```

### WYSIWYG Engine
- **Lexical** (Meta's framework) or **TipTap** (ProseMirror wrapper)
- Both support rich text, tables, callout boxes
- **Math integration:** KaTeX plugin; toolbar button inserts `$$...$$`
- **Tables:** MUI `Table` blocks within editor
- **Image upload:** Direct to ActiveStorage (local disk for 13GB budget)
- **AI assist button:** Opens modal for external AI generation; inline grammar check uses in-browser transformer.js

### Source Toggle
- Raw HTML/LaTeX string in textarea
- Regex-based parse to detect LaTeX blocks (`$$...$$` or `\(...\)`)
- Validation on blur: server-side KaTeX compile check

## Item Structure Builder
- Recursive tree: add/remove parts, sub-parts at any depth (up to 3 levels typical)
- Enumeration scheme selector: `(a)/(b)`, `A.`, `1.` etc.
- Real-time mark sum display (MUI Badge)
- Drag-and-drop reordering of siblings via `@dnd-kit/core`

## Stimulus Architecture
- **Global stimulus:** Rich text (HTML + MathJax/KaTeX markup) stored in `items.stimulus_html` on the root `stimulus` node
- **Local stimulus:** `items.prompt_html` on child nodes
- **Formatting:** Sanitized HTML; allowed tags via Loofah
- **Math:** KaTeX-rendered HTML stored as strings; server validates syntax

## Storage Considerations
- **HTML content:** ~10KB per item average → 20 users × 1000 items = 20MB
- **Images:** 2GB budget → enforce 5MB per upload, auto-compress to WebP
- **Versioning:** Full tree snapshots at ~50KB per version. 10 versions per item × 1000 items = 500MB

## Validation Rules
- **Title required** ≤ 255 chars
- **At least 1 part** required before publish (tree must have children)
- **Mark allocation:** positive integer, max 99
- **Estimated time:** positive integer minutes
- **Taxonomy tags:** at least 1 required before approval
- **LaTeX syntax:** server-side `katex.renderToString` test
- **Content hash:** SHA256 of prompt_html + stimulus_html for duplication detection

## Draft Autosave
- Debounced save (3 seconds) to `/api/v1/items/:id/autosave`
- Optimistic UI updates
- Conflict resolution: last-write-wins with version check
- **Server-side validation deferred:** KaTeX render check runs in background job, not on the autosave request path, to avoid saturating Rails with per-keystroke render calls

## Permissions
- **Item Author / Teacher:** create, edit own drafts
- **Senior Examiner:** edit any draft, approve (gated by `can_approve` flag)
- **Department Admin:** approve, reassign, force-archive (gated by `can_approve` flag)
- **Typist:** edit visual formatting only (marks, layout, not prompt text) — this is a UI restriction, not enforced at the model layer
