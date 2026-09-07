class ItemVersion < ApplicationRecord
  belongs_to :item

  validates :version_string, presence: true
  validates :snapshot_json, presence: true
end
