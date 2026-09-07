Rails.application.routes.draw do
  root "pages#show"
  get "pages/show"
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "sessions", to: "sessions#create"
      delete "sessions", to: "sessions#destroy"

      resources :organizations, only: [:index, :show, :create]
      resources :departments, only: [:index, :show, :create]
      resources :users, only: [:index, :show, :create]
      resources :user_departments, only: [:index, :show, :create, :destroy]
      resources :items, only: [:index, :show, :create, :update, :destroy] do
        resources :item_versions, only: [:index, :show]
        resources :item_revision_transitions, only: [:index, :create]
        resource :lock, only: [:create, :destroy]
        post :autosave, to: "items#autosave"
      end
    end
  end

  # Serve the SPA for all frontend routes so that refreshes and direct links work.
  # API routes are handled above; everything else falls through to the SPA shell.
  get "*path", to: "pages#show", constraints: ->(req) { !req.xhr? && req.format.html? }
end
