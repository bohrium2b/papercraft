# AI Authoring & Quality Assurance Plan

## Feature Intent

Papercraft includes an AI Authoring Assistant that helps teachers draft exam questions, generate worked solutions, and validate quality — without sending institutional content to external APIs without explicit consent.

The assistant has two trust boundaries. A lightweight 0.6B transformer.js model runs entirely in the browser during autosave, checking grammar and suggesting small text rewrites with zero data leaving the client. For full question generation, an external API (OpenAI or Anthropic) is called only on explicit user action — a button click in the item editor — and the prompt is sanitised by a `PromptSanitizer` that strips PII, template placeholders, and institution-specific terms.

Every generated item includes a fully worked solution and a structured mark allocation scheme. A five-check QA pipeline scores each item on metadata completeness, LaTeX syntax, mathematical solvability, ambiguity, and duplication risk, producing a readiness percentage before the item ever reaches a reviewer.

## AI Generation Service

### Architecture
Two trust boundaries, two implementations:

| Scope | Implementation | Used for |
|-------|---------------|----------|
| Complex generation | External API (OpenAI, Anthropic) | Full question generation, isomorphic mutation, QA ambiguity check |
| Simple operations | In-browser transformer.js (0.6B model) | Autosave grammar check, small text rewrite, diagram label suggestions |

### External AI Service Object
```ruby
class AiQuestionGenerator
  def generate(params)
    prompt = build_prompt(params)
    response = llm_client.chat(messages: prompt, response_format: { type: "json_object" })
    parse_response(response)
  end

  private

  def build_prompt(params)
    sanitized = PromptSanitizer.new(params).call
    [
      { role: "system", content: "You are an exam question author..." },
      { role: "user", content: "Generate a #{sanitized[:item_type]} question on #{sanitized[:topic]}..." }
    ]
  end
end
```

### Prompt Sanitization
The external API path includes a `PromptSanitizer` that strips:
- `{{variables}}` template placeholders
- Embedded image alt-text
- User-entered content matching PII patterns (names, IDs, institution-specific terms)

No student data is ever sent externally — the system does not ingest student work. The only data transmitted is item content the author is actively editing, and only on explicit user action (button click, not background process).

### Generation Capabilities
1. **Question + Mark Scheme:** Prompt includes mark allocation target
2. **Isomorphic Variants:** Prompt specifies parameter ranges; LLM generates mutated values
3. **Source Ingestion:** OCR via Tesseract (local) or API; structured extraction prompt
4. **QA Ambiguity Check:** LLM reviews question for ambiguity, clarity, and mathematical correctness

### In-Browser AI
- Loaded lazily via transformer.js (0.6B model) on the autosave panel
- Runs entirely client-side — no data leaves the browser
- Used for: grammar/spelling checks on prompt text, small text rewrites, diagram label suggestions
- No API calls, no external dependencies

## Quality Assurance Pipeline

### Automated Checks (Rails service + Sidekiq batch)
```ruby
class QualityCheckJob < ApplicationJob
  def perform(item_id)
    item = Item.find(item_id)
    checks = [
      MetadataCompletenessCheck.new(item),
      LatexSyntaxCheck.new(item),
      SolvabilityCheck.new(item),
      AmbiguityCheck.new(item),
      DuplicationCheck.new(item)
    ]
    score = checks.sum(&:run)
    item.update!(readiness_score: score)
  end
end
```

### Check Definitions
| Check | Method | Weight |
|-------|--------|--------|
| Metadata Completeness | Taxonomy tags present, marks > 0 | 25% |
| LaTeX Syntax | `katex.renderToString` success | 25% |
| Solvability | Symbolic math verification | 25% |
| Ambiguity | LLM review prompt (external API) | 15% |
| Duplication | Cosine similarity vs approved items | 10% |

### AI Review Prompt
```
Review this exam question for ambiguity, clarity, and mathematical correctness.
Return JSON: { "ambiguity_index": "low|medium|high", "issues": [], "score": 0-100 }
```

## Performance Budget
- **LLM API latency:** 3-8 seconds per generation
- **Quality checks:** 2-5 seconds per check (parallelized)
- **Total item generation:** ~15 seconds
- **Queue depth:** limit to 5 concurrent generations to control cost

## Data Privacy
- **ZDR enforcement:** Prompt payload audit; no PII transmitted
- **On-prem fallback:** Self-hosted LLM (Llama 3 70B via Ollama) option for institutions with data sovereignty requirements
- **Logging:** Generation requests logged; responses not stored long-term
