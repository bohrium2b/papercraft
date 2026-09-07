class Lock < ApplicationRecord
  class ResourceLockedError < StandardError; end

  belongs_to :user

  validates :lock_key, presence: true, uniqueness: true
  validates :resource_type, presence: true
  validates :resource_id, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }

  def self.lock_key_for(resource)
    "#{resource.class.name}:#{resource.id}"
  end

  def self.acquire!(key, user:, expires: 2.hours.from_now)
    if Lock.where(lock_key: key).active.exists?
      raise ResourceLockedError, "Resource is locked by another user"
    end
    create!(
      lock_key: key,
      resource_type: key.split(":").first,
      resource_id: key.split(":").last.to_i,
      user: user,
      expires_at: expires
    )
  end

  def release!
    destroy!
  end

  def self.with_tree_lock(resource, user:)
    keys = resource.is_a?(Item) ? Item.tree_lock_keys_for(resource) : [lock_key_for(resource)]
    locks = keys.map { |k| acquire!(k, user: user, expires: 2.hours.from_now) }
    yield
  ensure
    locks.each(&:release!) if locks
  end
end
