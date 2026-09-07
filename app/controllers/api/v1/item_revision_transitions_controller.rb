class Api::V1::ItemRevisionTransitionsController < Api::V1::BaseController
  def index
    item = Item.find(params[:item_id])
    transitions = item.item_revision_transitions
    render json: { data: transitions.map { |t| { type: "item_revision_transition", id: t.id.to_s, attributes: { from_status: t.from_status, to_status: t.to_status, comment: t.comment, reviewer_id: t.reviewer_id, created_at: t.created_at, updated_at: t.updated_at } } } }
  end

  def create
    item = Item.find(params[:item_id])
    transition = item.item_revision_transitions.new(from_status: params.require(:from_status), to_status: params.require(:to_status), comment: params[:comment], reviewer: current_user)
    if transition.save
      render json: { data: { type: "item_revision_transition", id: transition.id.to_s, attributes: { from_status: transition.from_status, to_status: transition.to_status, comment: transition.comment, reviewer_id: transition.reviewer_id, created_at: transition.created_at, updated_at: transition.updated_at } } }, status: :created
    else
      render_error(transition)
    end
  end
end
