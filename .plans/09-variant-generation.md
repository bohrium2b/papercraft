# Parallel Variant Generation Plan

## Feature Intent

For large examination halls, Papercraft generates parallel paper variants (Version A, B, C) so that adjacent students receive different but equivalent exams. The variant engine is deterministic — no LLM calls — and applies three mutation strategies:

1. **Structural Permutation:** Reorders questions and sub-parts within sections while keeping stimulus dependencies intact.
2. **Isomorphic Item Substitution:** Swaps bank items that share identical learning outcomes, marks, difficulty, and item type, with zero direct duplication.
3. **Dynamic Parameterisation:** For items tagged as parameterizable, mutates numerical constants (coefficients, values) within defined bounds and re-renders the worked solution from a stored template.

After generation, an equivalence audit matrix verifies that every variant matches the master on total marks, difficulty mean, duration, and topic coverage. Each variant receives a unique form code (e.g., "Form X - Version B") that prints on the cover sheet and correlates automatically to its own mark scheme.

## Variant Model

```ruby
class ExamVariant < ApplicationRecord
  belongs_to :exam # master exam
  # columns: variant_code (A/B/C), mutation_seed (int), generated_at
  has_many :exam_items, dependent: :destroy
  # Variant inherits ExamItem structure; positions and marks recalculated per variant
end
```

Variant generation is **deterministic only** — no LLM calls. The `ExamVariant` is a structural copy of the `Exam` with mutated item selections.

## Mutation Strategies

### Strategy 1: Structural Permutation
- Reorder questions within sections
- Shuffle sub-part order (maintaining stimulus dependencies)
- Ruby `Array#shuffle` with seed for reproducibility
- Does not change which items appear, only their order

### Strategy 2: Isomorphic Item Substitution
- Swap approved items with same taxonomy profile
- Query: `learning_outcome_id`, `marks`, `difficulty ± 1`, `item_type`
- Ensure no direct duplication via MD5 hash of `content_hash`
- Substituted items must have the same `node_type` (stimulus items stay as stimuli)

### Strategy 3: Dynamic Parameterization
- Regex extraction of numeric values from LaTeX/prompt
- Replace with random values within defined bounds (stored in `Item#irt_params` JSONB)
- Regenerate solution via stored solution template (not LLM)
- **Constraint:** Only for items tagged `is_parameterizable: true`

## Generation Service
```ruby
class VariantMutationEngine
  def generate(master_exam_id, variant_count)
    master = Exam.find(master_exam_id)
    variants = []

    variant_count.times do |i|
      variant_code = ("A".."Z").to_a[i]
      exam_variant = master.exam_variants.create!(variant_code: variant_code, mutation_seed: rand(1_000_000))
      variants << mutate_exam(master, exam_variant)
    end

    variants
  end

  private

  def mutate_exam(master, variant)
    # Apply all three strategies
    permuted = apply_structural_permutation(master)
    substituted = apply_isomorphic_substitution(permuted)
    parameterized = apply_dynamic_parameterization(substituted)

    # Persist ExamItem records for the variant
    parameterized.each do |exam_item|
      variant.exam_items.create!(
        exam_section: exam_item.exam_section,
        item_version: exam_item.item_version,
        position: exam_item.position,
        marks: exam_item.marks
      )
    end

    variant
  end
end
```

## Equivalence Audit
```ruby
class VariantEquivalenceChecker
  def check(variants)
    variants.map do |v|
      {
        total_marks: v.exam_items.sum(:marks),
        difficulty_mean: v.exam_items.average(:difficulty_nominal),
        duration_estimate: v.exam_items.sum(:estimated_minutes),
        topic_coverage: compute_coverage(v)
      }
    end
  end
end
```

### Validation Matrix
- Total marks: must equal master
- Difficulty mean: ± 0.5 of master
- Duration: ± 5 minutes of master
- Topic coverage: 100% overlap
- Duplication rate: 0% direct match (content_hash collision check)

## Parameter Bounds
Items that are parameterizable store bounds in `irt_params` JSONB:

```json
{
  "parameters": [
    { "name": "coefficient_a", "min": 1, "max": 10, "step": 1 },
    { "name": "coefficient_b", "min": 2, "max": 20, "step": 0.5 }
  ],
  "solution_template": "Substituting a = {coefficient_a} and b = {coefficient_b}..."
}
```

The mutation engine extracts values, randomises within bounds, and re-renders the solution by substituting into the template.

## Storage Impact
- Variant mappings: ~100 bytes per item × 50 items × 3 variants = 15KB per exam
- 20 exams × 3 variants = 600KB

## Performance
- Generation time: ~5 seconds per variant (no LLM calls)
- Concurrency: 1 variant at a time (serialized)
- Queue: Sidekiq batch job
