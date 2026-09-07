# Cover Sheet & Document Template Builder Plan

## Feature Intent

Every institution has its own exam house style: logo placement, header fonts, instruction wording, student name grids, and "DO NOT TURN OVER" banners. The Template Builder lets administrators design these layouts visually, without touching code.

Designers drag and drop blocks onto an A4 or Letter canvas — logos, rich text, student name/ID fields, barcodes — and insert dynamic variables like `{{exam.title}}`, `{{exam.total_marks}}`, `{{student.name_field}}`, and `{{exam.form_code}}`. At PDF compile time, the template engine replaces these placeholders with real exam data. The same system powers section headers and footers, so a department can define a complete document style once and reuse it across every paper.

## Data Model

```ruby
class DocumentTemplate < ApplicationRecord
  belongs_to :department
  # columns: name, template_type (cover_sheet | section_header | footer), content_json
end
```

`content_json` stores the template layout as JSON: positioned blocks (logo, text, table, barcode), variable references, and page setup (size, orientation, margins). Template rendering is delegated to the `PdfKit` module — the template builder only manages the JSON structure.

## Template Builder UI

### MUI Canvas Editor
```
TemplateBuilder
├── Toolbar ([Insert Logo] [Insert Variable] [Grid Toggle] [Page Setup])
├── Canvas (A4 / Letter sized div with absolute positioning)
│   ├── LogoBlock (draggable, resizable)
│   ├── TextBlock (rich text, supports {{variables}})
│   ├── TableBlock (student name grid, desk number)
│   └── BarcodeBlock (auto-generated exam form code)
├── VariablePalette (MUI Drawer with available tags)
└── PreviewPanel (MUI Tabs: Edit | Print Preview)
```

### Variables
| Key | Description | Example |
|-----|-------------|---------|
| `{{institution.name}}` | Top-level org name | Northgate High School |
| `{{exam.title}}` | Exam title | Mathematics Extension 1 |
| `{{exam.total_marks}}` | Total marks | 100 |
| `{{exam.reading_time}}` | Reading time | 5 minutes |
| `{{exam.working_time}}` | Working time | 90 minutes |
| `{{exam.form_code}}` | Variant code | Form X - Version A |
| `{{student.name_field}}` | Name input box | [_______________] |
| `{{student.id_field}}` | ID input box | [_______________] |
| `{{cohort.year_group}}` | Year group | Year 11 |

### Variable Injection at Compile Time
- **Regex replacement** in template HTML before PDF render
- **Fallback defaults** if variable missing
- **Custom formats:** date, uppercase, padded numbers

## Page Setup
- **Page size:** A4 or Letter (per template)
- **Orientation:** Portrait / Landscape
- **Margins:** Top, Bottom, Inside (binding), Outside (configurable)
- **Grid overlay:** None / Lined / Graph (for math papers)

## Storage Impact
- Template JSON: ~20KB per template
- Logo images: ~200KB per logo
- ~10 templates per department × 50 departments = 10MB

## Integration
- Templates referenced by `DocumentTemplateId` in Exam
- PDF compilation service merges cover sheet + question paper + mark scheme
- All PDF rendering delegated to `PdfKit` module (CoverSheetRenderer)
