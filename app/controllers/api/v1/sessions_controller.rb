class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate, only: [:create]

  def create
    user = User.find_by(email: params.require(:email))
    if user&.valid_password?(params.require(:password))
      session[:user_id] = user.id
      render json: { data: { type: "session", id: user.id.to_s, attributes: { email: user.email, name: user.name, department_id: user.department_id, can_approve: user.can_approve } } }, status: :created
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:user_id)
    head :no_content
  end
end
