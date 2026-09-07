class Api::V1::ItemVersionsController < Api::V1::BaseController
  def index
    item = Item.find(params[:item_id])
    versions = item.item_versions
    render json: { data: versions.map { |v| { type: "item_version", id: v.id.to_s, attributes: { version_string: v.version_string, snapshot_json: v.snapshot_json, created_at: v.created_at, updated_at: v.updated_at } } } }
  end

  def show
    item = Item.find(params[:item_id])
    version = item.item_versions.find(params[:id])
    render json: { data: { type: "item_version", id: version.id.to_s, attributes: { version_string: version.version_string, snapshot_json: version.snapshot_json, created_at: version.created_at, updated_at: version.updated_at } } }
  end
end
