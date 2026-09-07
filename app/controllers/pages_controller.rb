class PagesController < ActionController::Base
  protect_from_forgery with: :exception

  def show
    render layout: "application"
  end
end
