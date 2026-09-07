# Print-Ready Layout & Pagination Engine Plan

## Feature Intent

The Print Engine transforms structured exam data into professional, print-ready PDFs that respect physical page geometry. Authors configure how much vertical space each question part receives — ruled lines for short answers, blank space for derivations, graph grids for coordinate problems, or right-aligned answer lines with unit brackets.

The pagination engine prevents common print defects: orphaned question prompts stranded at the bottom of a page, stimulus blocks split across pages, and widowed section headers. Overflow markers like "[ CONTINUED ON NEXT PAGE ]" are inserted automatically. Section II can be forced to start on a right-hand odd page for booklet printing.

All PDF generation is streamed directly to disk via Prawn, so even a 20-page paper never loads the full document into memory. A single serialized compilation queue prevents concurrent pdflatex processes from exhausting the 2 GB RAM budget.

## PDF Compilation Service

### Technology
- **Prawn** (Ruby PDF generation library) for layout
- **LaTeX** for math rendering (existing TikZ pipeline)
- **PDF merging:** Combine cover sheet, question paper, mark scheme via `CombinePDF` gem
- **All rendering delegated to `PdfKit` module** — no duplicated Prawn logic

### Compilation Flow
```
Exam
  → Render Cover Sheet (PdfKit::CoverSheetRenderer)
  → Render Each Section (PdfKit::QuestionPaperRenderer)
    → Insert items with stimulus + response space
    → Apply pagination guards
  → Render Mark Scheme (PdfKit::MarkSchemeRenderer)
  → Merge PDFs (PdfKit::PdfMerger)
  → Add cryptographic watermark (PdfKit::WatermarkInjector)
```

## Response Space Allocation

### Layout Modes
| Mode | Prawn Implementation |
|------|----------------------|
| Rule Lines | Horizontal line every 8mm (`stroke_horizontal_line`) |
| Blank Space | Empty bounding box |
| Graph Grid | 1cm grid via `stroke_rectangle` in loop |
| Right Answer Line | Dotted line + unit box at bottom-right |

### Part-Level Configuration
```ruby
class PartLayoutRule < ApplicationRecord
  belongs_to :item
  # columns: spacing_mode, height_mm, line_pitch_mm, show_answer_line, answer_units
end
```

## Pagination Protection

### Rules
1. **Orphan control:** Keep prompt + first 30mm of space on same page
2. **Stimulus attachment:** Global stimulus stays with first part referencing it
3. **Overflow markers:** `[ CONTINUED ON NEXT PAGE ]` text at page bottom
4. **Section breaks:** Force right-hand page start for Section II (odd page)
5. **Avoid widows/orphans:** Prawn `start_new_page` with conditional check

### Implementation
```ruby
class PdfKit::Pagination
  ORPHAN_THRESHOLD_MM = 30

  def will_orphan?(exam_item, remaining_page_height)
    estimated_height = estimate_item_height(exam_item)
    remaining_page_height - estimated_height < ORPHAN_THRESHOLD_MM
  end

  def estimate_item_height(exam_item)
    # Sum: stimulus height + prompt height + response space height
    # based on layout rules and character count
  end
end
```

## Memory & Performance
- **PDF stream generation:** Prawn streams directly to file (no full document in memory)
- **Chunk size:** 1 section at a time
- **Concurrency:** 1 compilation at a time (Sidekiq serialized queue)
- **Expected memory:** ~200MB per compilation (Prawn + LaTeX output)
- **Disk:** 500KB per exam PDF × 100 exams = 50MB

## Caching
- Compiled PDFs cached by `exam_id + variant_code + compiled_at`
- Cache key in Redis; file stored in `/var/cache/papercraft/pdfs/`
- LRU eviction: delete files > 30 days old
