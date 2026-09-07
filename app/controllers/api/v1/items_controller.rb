class Api::V1::ItemsController < Api::V1::BaseController
  def index
    items = Item.all
    render json: { data: items.map { |item| item_json(item) } }
  end

  def show
    item = Item.find(params[:id])
    render json: { data: item_json(item) }
  end

  def create
    item = Item.new(item_params.merge(author: current_user))
    if item.save
      render json: { data: item_json(item) }, status: :created
    else
      render_error(item)
    end
  end

  def update
    item = Item.find(params[:id])
    if item.update(item_params)
      render json: { data: item_json(item) }
    else
      render_error(item)
    end
  end

  def destroy
    item = Item.find(params[:id])
    item.destroy
    head :no_content
  end

  def autosave
    item = Item.find(params[:id])
    if item.update(item_params)
      render json: { data: item_json(item) }
    else
      render_error(item)
    end
  end

  private

  def item_params
    params.require(:data).require(:attributes).permit(:title, :stimulus_html, :prompt_html, :marks, :estimated_minutes, :is_parameterizable, :item_type, :difficulty_nominal, :node_type, :status, :department_id, :parent_id)
  end

  def item_json(item)
    {
      type: "item",
      id: item.id.to_s,
      attributes: {
        title: item.title,
        stimulus_html: item.stimulus_html,
        prompt_html: item.prompt_html,
        marks: item.marks,
        estimated_minutes: item.estimated_minutes,
        is_parameterizable: item.is_parameterizable,
        item_type: item.item_type,
        difficulty_nominal: item.difficulty_nominal,
        node_type: item.node_type,
        status: item.status,
        content_hash: item.content_hash,
        usage_count: item.usage_count,
        department_id: item.department_id,
        author_id: item.author_id,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    }
  end
end
