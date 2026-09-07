class Organization < ApplicationRecord
  has_many :departments, dependent: :destroy

  validates :name, presence: true
end
