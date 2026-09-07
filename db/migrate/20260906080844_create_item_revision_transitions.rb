class CreateItemRevisionTransitions < ActiveRecord::Migration[8.1]
  def change
    create_table :item_revision_transitions do |t|
      t.references :item, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.string :from_status
      t.string :to_status
      t.text :comment

      t.timestamps
    end
  end
end
