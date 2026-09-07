class Api::V1::OrganizationsController < Api::V1::BaseController
  def index
    organizations = Organization.all
    render json: { data: organizations.map { |org| { type: "organization", id: org.id.to_s, attributes: { name: org.name, created_at: org.created_at, updated_at: org.updated_at } } } }
  end

  def show
    organization = Organization.find(params[:id])
    render json: { data: { type: "organization", id: organization.id.to_s, attributes: { name: organization.name, created_at: organization.created_at, updated_at: organization.updated_at } } }
  end

  def create
    organization = Organization.new(name: params.require(:name))
    if organization.save
      render json: { data: { type: "organization", id: organization.id.to_s, attributes: { name: organization.name, created_at: organization.created_at, updated_at: organization.updated_at } } }, status: :created
    else
      render_error(organization)
    end
  end
end
