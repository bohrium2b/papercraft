# Exam Assembly & Blueprint Engine Plan

## Feature Intent

The Blueprint Engine turns curriculum requirements into actual exam papers. A Senior Examiner defines a blueprint: "100 marks, 90 minutes, 30% Differential Calculus, 20% Trigonometry, minimum 35% Analysis-level questions." The engine then either auto-assembles a paper from the approved item bank using a constraint solver, or lets the examiner assemble manually with drag-and-drop.

During manual assembly, a live compliance matrix updates in real time, showing target versus actual marks, difficulty mean, duration estimate, and topic coverage. If Motion & Vectors is 4 marks short of target, the system highlights the gap and suggests replacement items from the bank. The examiner accepts or overrides any suggestion.

Every `ExamItem` link pins to a specific `ItemVersion`, so a paper compiled today remains exactly the same even if the source item is edited and re-approved next month.

## Data Model

### Blueprint
```ruby
class Blueprint < ApplicationRecord
  belongs_to :department
  has_many :blueprint_sections, dependent: :destroy
  has_many :blueprint_constraints, dependent: :destroy
  # columns: name, total_marks_target, duration_minutes
  belongs_to :locked_by, class_name: "User", optional: true
  # Locking: when locked_by is present, the blueprint cannot be edited
  # but can still be viewed and used for assembly
end

class BlueprintSection < ApplicationRecord
  belongs_to :blueprint
  has_many :blueprint_constraints, dependent: :destroy
  # columns: name, instruction_text, item_count_target, mark_target,
  #          question_type (string), order (int)
end

class BlueprintConstraint < ApplicationRecord
  belongs_to :blueprint_section
  belongs_to :learning_outcome, optional: true
  belongs_to :cognitive_framework, optional: true
  # columns: mark_target, difficulty_min, difficulty_max,
  #          cognitive_level_min, item_type, topic_coverage_weight (float)
end
```

### Exam Assembly
```ruby
class Exam < ApplicationRecord
  belongs_to :blueprint
  belongs_to :department
  belongs_to :locked_by, class_name: "User", optional: true
  has_many :exam_sections, dependent: :destroy
  has_many :exam_items, dependent: :destroy
  has_many :exam_variants, dependent: :destroy
  has_one :mark_scheme, dependent: :destroy
  # columns: title, total_marks, duration_minutes, compiled_pdf_path, variant_count
end

class ExamSection < ApplicationRecord
  belongs_to :exam
  belongs_to :blueprint_section
  has_many :exam_items, dependent: :destroy
  # columns: name, instruction_text, order
end

class ExamItem < ApplicationRecord
  belongs_to :exam_section
  belongs_to :item_version  # pins to a specific version at assembly time
  # columns: position, marks (int, nullable — nulls fall back to item_version.item.marks)
end
```

`ExamItem#marks` is nullable. When null, the exam inherits the item's own `marks` value. This allows per-exam mark overrides without duplicating the source.

## Assembly Algorithm

### Constraint Solver (OR-Tools CP-SAT)
```ruby
class ExamAssemblyService
  def assemble(blueprint_id)
    blueprint = Blueprint.includes(sections: :constraints).find(blueprint_id)
    exam = blueprint.exams.create!(title: blueprint.name, department: blueprint.department)

    blueprint.sections.each do |section|
      candidates = ItemVersion.approved
        .where(department_id: blueprint.department_id)
        .includes(:item => :item_taxonomies)

      solution = ConstraintSolver.new(candidates, section.constraints).solve
      solution.item_versions.each do |iv|
        exam.exam_items.create!(
          exam_section: section.exam_sections.create!(...),
          item_version: iv,
          position: ...
        )
      end
    end

    exam
  end
end
```

### Constraint Solver Interface
```ruby
class ConstraintSolver
  def initialize(candidates, constraints)
    @candidates = candidates
    @constraints = constraints
  end

  def solve
    model = ORTools::CP::CpModel.new

    # Variables: x[i] = 1 if candidate i is selected
    vars = @candidates.each_with_index.map { |c, i| model.new_bool_var("x_#{i}") }

    # Constraints
    @constraints.each do |c|
      case c.constraint_type
      when "item_count"
        model.add_constraint(vars.sum, "==", c.item_count_target)
      when "mark_target"
        model.add_constraint(
          vars.zip(@candidates).sum { |v, c| v * c.item.marks },
          "==", c.mark_target
        )
      when "difficulty_range"
        @candidates.each_with_index do |c, i|
          model.add_constraint(vars[i] * c.item.difficulty_nominal, ">=", c.difficulty_min) if c.difficulty_min
          model.add_constraint(vars[i] * c.item.difficulty_nominal, "<=", c.difficulty_max) if c.difficulty_max
        end
      when "taxonomy_coverage"
        required_outcomes = c.learning_outcome_ids
        required_outcomes.each do |lo_id|
          matching = @candidates.each_with_index.filter_map { |c, i| i if c.item.item_taxonomies.any? { |t| t.learning_outcome_id == lo_id } }
          model.add_constraint(matching.sum { |i| vars[i] }, ">=", 1)
        end
      when "item_type"
        matching = @candidates.each_with_index.filter_map { |c, i| i if c.item.item_type == c.item_type }
        model.add_constraint(matching.sum { |i| vars[i] }, ">=", 1)
      when "exclusion"
        # Exclude items used in last N exams
      end
    end

    # Objective: minimise deviation from mark targets, maximise taxonomy coverage
    model.maximize(...)

    solver = ORTools::CP::CpSolver.new
    solver.parameters.max_time_in_seconds = 5.0
    solver.solve(model)

    selected = vars.each_with_index.filter_map { |v, i| @candidates[i] if solver.boolean_true(v) }
    Solution.new(selected)
  end
end
```

The CP-SAT solver handles exact mark totals, exact item counts, difficulty ranges, and topic coverage simultaneously. Fallback (if solver times out at 5s) is the sequential filter approach.

### Constraint Filters (fallback path)
1. **Topic match:** `learning_outcome_id IN (...)`
2. **Mark sum:** Cumulative marks <= section target
3. **Difficulty range:** `difficulty_nominal BETWEEN min AND max`
4. **Cognitive level:** Bloom/DOK classification from department framework
5. **Item type:** Multiple choice, structured, etc.
6. **Exclusion:** Exclude items used in last N exams (configurable cooldown)

## Live Compliance Matrix
- Computed in real-time as items are added/removed
- MUI `Table` showing: Target vs Actual, Gap, Status
- Alert when gap > 0; auto-suggest replacement items

## Replacement Suggestions
- Query approved items matching missing constraint
- Rank by: taxonomy match score, difficulty proximity, freshness

## Manual Assembly UI
- Drag-and-drop item list (MUI `DragDropContext` + `Box`)
- Live metrics panel (MUI `Card` + `Table`)
- Add item modal: search + filter + preview
- Remove item with confirmation

## Storage Impact
- Blueprints: ~20KB per blueprint
- Exam items: ~200 bytes per link × 50 items per exam × 20 exams = 200KB
