class ItemRevisionTransition < ApplicationRecord
  belongs_to :item
  belongs_to :reviewer, class_name: "User", optional: true

  validates :from_status, presence: true
  validates :to_status, presence: true
end
