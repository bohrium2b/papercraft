class Api::V1::LocksController < Api::V1::BaseController
  def create
    item = Item.find(params[:item_id])
    Lock.with_tree_lock(item, user: current_user) do
      render json: { data: { type: "lock", id: item.id.to_s, attributes: { resource_type: "Item", resource_id: item.id, user_id: current_user.id, expires_at: 2.hours.from_now } } }, status: :created
    end
  end

  def destroy
    item = Item.find(params[:item_id])
    Lock.tree_lock_keys_for(item).each do |key|
      Lock.where(lock_key: key, user: current_user).destroy_all
    end
    head :no_content
  end
end
