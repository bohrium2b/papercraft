require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Papercraft
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Add back session and cookie middleware for Sorcery cookie-based auth
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: "_papercraft_session", same_site: :lax
    config.action_dispatch.cookies_same_site_protection = :lax

    # Redis cache store (DB 1 for SVG cache, DB 0 for sessions/Sidekiq)
    config.cache_store = :redis_cache_store, {
      url: ENV.fetch("REDIS_CACHE_URL") { "redis://localhost:6379/1" },
      pool_size: ENV.fetch("RAILS_MAX_THREADS") { 5 },
      expires_in: 1.day
    }

    # Sidekiq as ActiveJob queue adapter
    config.active_job.queue_adapter = :sidekiq
  end
end
