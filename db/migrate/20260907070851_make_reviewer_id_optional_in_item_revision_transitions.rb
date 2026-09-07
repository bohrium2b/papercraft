class MakeReviewerIdOptionalInItemRevisionTransitions < ActiveRecord::Migration[8.1]
  def change
    change_column_null :item_revision_transitions, :reviewer_id, true
  end
end
