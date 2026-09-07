class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::ImplicitRender

  before_action :authenticate

  private

  def authenticate
    return if current_user
    not_authenticated
  end

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def not_authenticated
    render json: { error: "Not authenticated" }, status: :unauthorized
  end
end
