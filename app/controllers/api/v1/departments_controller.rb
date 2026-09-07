class Api::V1::DepartmentsController < Api::V1::BaseController
  def index
    departments = Department.all
    render json: { data: departments.map { |dept| { type: "department", id: dept.id.to_s, attributes: { name: dept.name, organization_id: dept.organization_id, created_at: dept.created_at, updated_at: dept.updated_at } } } }
  end

  def show
    department = Department.find(params[:id])
    render json: { data: { type: "department", id: department.id.to_s, attributes: { name: department.name, organization_id: department.organization_id, created_at: department.created_at, updated_at: department.updated_at } } }
  end

  def create
    department = Department.new(name: params.require(:name), organization_id: params.require(:organization_id))
    if department.save
      render json: { data: { type: "department", id: department.id.to_s, attributes: { name: department.name, organization_id: department.organization_id, created_at: department.created_at, updated_at: department.updated_at } } }, status: :created
    else
      render_error(department)
    end
  end
end
