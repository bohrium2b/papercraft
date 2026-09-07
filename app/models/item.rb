class Item < ApplicationRecord
  include AASM

  belongs_to :department
  belongs_to :author, class_name: "User"
  belongs_to :parent, class_name: "Item", optional: true
  has_many :children, class_name: "Item", foreign_key: "parent_id", dependent: :destroy
  has_many :item_versions, dependent: :destroy
  has_many :item_revision_transitions, dependent: :destroy
  has_many :item_taxonomies, dependent: :destroy
  has_many :item_layout_rules, dependent: :destroy
  has_one_attached :stimulus_image

  enum :node_type, { stimulus: 0, question: 1, subpart: 2 }
  enum :status,    { draft: 0, pending_review: 1, revisions_requested: 2, approved: 3, archived: 4 }

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

  validates :title, presence: true, length: { maximum: 255 }
  validates :marks, numericality: { only_integer: true, greater_than: 0, less_than: 100 }, allow_nil: true
  validates :estimated_minutes, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :difficulty_nominal, numericality: { only_integer: true, greater_than: 0, less_than: 11 }, allow_nil: true
  validates :content_hash, uniqueness: true, allow_nil: true

  before_save :compute_content_hash

  scope :in_department, ->(dept_id) { where(department_id: dept_id) }

  def aasm_read_state(name = :default)
    state = send(self.class.aasm(name).attribute_name)
    if !state || state.to_s.empty?
      aasm_new_record? ? self.class.aasm(name).determine_state_name(self.class.aasm(name).initial_state) : nil
    else
      state.to_sym
    end
  end

  def self.tree_lock_keys_for(resource)
    keys = [Lock.lock_key_for(resource)]
    if resource.is_a?(Item)
      resource.children.each do |child|
        keys.concat(tree_lock_keys_for(child))
      end
    end
    keys.uniq
  end

  private

  def compute_content_hash
    raw = [prompt_html.to_s, stimulus_html.to_s].join("|")
    self.content_hash = Digest::SHA256.hexdigest(raw)
  end

  def snapshot_version
    item_versions.create!(
      version_string: "#{item_versions.count + 1}.0",
      snapshot_json: serialize_tree
    )
  end

  def serialize_tree
    {
      item: attributes.slice("id", "title", "stimulus_html", "prompt_html", "marks", "estimated_minutes", "node_type", "item_type", "difficulty_nominal"),
      children: children.map { |c| { item: c.attributes.slice("id", "title", "stimulus_html", "prompt_html", "marks", "estimated_minutes", "node_type", "item_type", "difficulty_nominal"), children: [] } }
    }
  end
end
