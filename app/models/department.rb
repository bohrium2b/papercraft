class Department < ApplicationRecord
  belongs_to :organization
  has_many :user_departments, dependent: :destroy
  has_many :users, through: :user_departments
  has_many :items, dependent: :destroy
  has_many :item_versions, through: :items
  has_many :item_revision_transitions, through: :items
  has_many :locks, dependent: :destroy

  validates :name, presence: true
end
