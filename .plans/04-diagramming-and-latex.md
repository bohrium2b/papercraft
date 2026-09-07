# Vector Diagramming & LaTeX Compilation Plan

## Feature Intent

Teachers need two ways to create diagrams: a visual canvas for quick geometric shapes, force diagrams, and labelled axes (no LaTeX knowledge required), and a code editor for advanced mathematics (complicated plots, chemical structures, circuit diagrams) where TikZ or Asymptote is the right tool.

The canvas path uses Konva.js with snap-to-grid, a shape palette, and direct SVG export — a physics teacher can draw a velocity-time graph in 30 seconds. The code path uses Monaco Editor with TikZ syntax highlighting and a per-department LaTeX preamble, so a maths department can centralise their custom macros and package imports.

Both paths converge on the same output: clean, resolution-independent SVG that embeds directly into question stimuli or prompts. The server-side compilation pipeline runs pdflatex + dvisvgm in an isolated Sidekiq job with strict memory limits, so even a complex chemfig diagram cannot crash the host. A browser-side WASM fallback is planned for offline preview.

## System Architecture
- **Server-side LaTeX compilation** as isolated Sidekiq job
- **Browser-side preview** via KaTeX for math; SVG for diagrams
- **Compiled output:** SVG stored in ActiveStorage or Redis cache (DB 1)

## Two Authoring Paths

The diagram system has two independent entry points that converge on the same output format (SVG):

### Path 1: Visual Canvas Editor (Konva)
```
DiagramEditor (Canvas Mode)
├── ModeSelector (Canvas | TikZ Source)
├── CanvasToolbar (shapes, arrows, nodes, grid toggle)
├── KonvaStage (2D canvas with snap-to-grid)
│   ├── ShapePalette (rectangle, circle, arrow, line, text, axis)
│   └── GridOverlay (configurable 5mm / 10mm)
├── PropertyPanel (colour, stroke width, label text)
└── ActionBar ([ Compile to SVG ] [ Embed to Item ])
```

- **Konva.js** or **React-Konva** for 2D canvas
- Grid overlay (configurable 5mm / 10mm)
- Shape palette: rectangle, circle, arrow, line, text, axis
- Snap-to-grid on drag
- Export canvas state as SVG directly — **no TikZ intermediate format**
- **Memory budget:** Canvas state JSON ~50KB per diagram

### Path 2: TikZ Source Editor (Monaco)
```
DiagramEditor (TikZ Mode)
├── ModeSelector (Canvas | TikZ Source)
├── PreambleConfig (packages, macros — per-department)
├── MonacoEditor (TikZ syntax highlighting via TextMate grammar)
├── InlineErrorMarkers (from server compilation response)
└── ActionBar ([ Compile ] [ Embed to Item ])
```

- **Monaco Editor** (VS Code engine) with TikZ language mode
- Syntax highlighting via TextMate grammar
- Inline error markers from server compilation response
- Preamble management: per-department LaTeX preamble stored in DB
- This path is for teachers familiar with TikZ or needing advanced math diagrams (complicated plots, chemfig, circuitikz) that the canvas cannot produce

Both paths store the same output format: SVG in `Diagram#svg_content`.

## LaTeX Compilation Pipeline

### Server-Side Job
```ruby
class TikzCompilationJob < ApplicationJob
  queue_as :latex
  sidekiq_options lock: :until_and_executing, lock_timeout: 60, retry: 2

  def perform(diagram_id)
    diagram = Diagram.find(diagram_id)
    tmp = Dir.mktmpdir

    File.write("#{tmp}/main.tex", diagram.tex_source)
    system("pdflatex -interaction=nonstopmode -output-directory=#{tmp} main.tex")
    system("dvisvgm --no-fonts --output=#{tmp}/output.svg #{tmp}/main.dvi")

    svg = File.read("#{tmp}/output.svg")
    diagram.update!(compiled_svg: svg, compiled_at: Time.current)
  ensure
    FileUtils.rm_rf(tmp)
  end
end
```

### Compilation Constraints
- **Timeout:** 30 seconds per job
- **Concurrency:** 1 (serialized queue)
- **Allowed packages:** `tikz`, `pgfplots`, `chemfig`, `circuitikz` (whitelist)
- **Disallowed:** `\write18`, `\input`, `\include` (security)
- **Sanitization:** Regex blacklist before compilation (supplementary to container isolation)

### Browser WASM Fallback
- **TikZ-JS** or lightweight Wasm pdflatex (experimental, optional for MVP)
- Preview only; server compilation required for final PDF export

## Storage & Memory
- **SVG output:** ~50-200KB per diagram
- **Cache:** Redis DB 1 (64MB) → ~300 diagrams in memory
- **Disk fallback:** ActiveStorage local disk
- **Preamble storage:** `departments.latex_preamble` TEXT column (~5KB per department)

## Security
- LaTeX source sanitization (no shell commands, no file access)
- Compilation runs as dedicated unprivileged user in network-isolated Docker container
- Output SVG sanitized (remove script tags, event handlers)
- Resource limits: `ulimit -v 524288` (512MB virtual memory) + cgroup memory limit

## Integration with Item Editor
- Insert button embeds `<img src="..." />` or inline SVG into item stimulus or prompt
- Re-compilation triggered if source changes
- Compilation status shown in MUI Badge: `Compiling...` / `Ready` / `Failed`
- Canvas diagrams and TikZ diagrams are embedded identically — both produce SVG
