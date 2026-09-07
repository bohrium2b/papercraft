class Api::V1::UserDepartmentsController < Api::V1::BaseController
  def index
    user_departments = UserDepartment.all
    render json: { data: user_departments.map { |ud| { type: "user_department", id: ud.id.to_s, attributes: { user_id: ud.user_id, department_id: ud.department_id, can_approve: ud.can_approve, created_at: ud.created_at, updated_at: ud.updated_at } } } }
  end

  def show
    user_department = UserDepartment.find(params[:id])
    render json: { data: { type: "user_department", id: user_department.id.to_s, attributes: { user_id: user_department.user_id, department_id: user_department.department_id, can_approve: user_department.can_approve, created_at: user_department.created_at, updated_at: user_department.updated_at } } }
  end

  def create
    user_department = UserDepartment.new(user_id: params.require(:user_id), department_id: params.require(:department_id), can_approve: params[:can_approve] || false)
    if user_department.save
      render json: { data: { type: "user_department", id: user_department.id.to_s, attributes: { user_id: user_department.user_id, department_id: user_department.department_id, can_approve: user_department.can_approve, created_at: user_department.created_at, updated_at: user_department.updated_at } } }, status: :created
    else
      render_error(user_department)
    end
  end

  def destroy
    user_department = UserDepartment.find(params[:id])
    user_department.destroy
    head :no_content
  end
end
