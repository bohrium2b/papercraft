class Api::V1::UsersController < Api::V1::BaseController
  def index
    users = User.all
    render json: { data: users.map { |user| { type: "user", id: user.id.to_s, attributes: { email: user.email, name: user.name, department_id: user.department_id, can_approve: user.can_approve, created_at: user.created_at, updated_at: user.updated_at } } } }
  end

  def show
    user = User.find(params[:id])
    render json: { data: { type: "user", id: user.id.to_s, attributes: { email: user.email, name: user.name, department_id: user.department_id, can_approve: user.can_approve, created_at: user.created_at, updated_at: user.updated_at } } }
  end

  def create
    user = User.new(email: params.require(:email), password: params.require(:password), name: params.require(:name), department_id: params.require(:department_id))
    if user.save
      render json: { data: { type: "user", id: user.id.to_s, attributes: { email: user.email, name: user.name, department_id: user.department_id, can_approve: user.can_approve, created_at: user.created_at, updated_at: user.updated_at } } }, status: :created
    else
      render_error(user)
    end
  end
end
