class User < ApplicationRecord
  authenticates_with_sorcery!

  belongs_to :department
  has_many :user_departments, dependent: :destroy
  has_many :departments, through: :user_departments
  has_many :owned_items, class_name: "Item", foreign_key: "author_id", dependent: :destroy
  has_many :item_revision_transitions, class_name: "ItemRevisionTransition", foreign_key: "reviewer_id", dependent: :nullify
  has_many :locks, dependent: :destroy

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :password, presence: true, length: { minimum: 8 }, if: -> { new_record? || password.present? }
end
