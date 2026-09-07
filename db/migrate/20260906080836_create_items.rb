class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.string :title, null: false
      t.text :stimulus_html
      t.text :prompt_html
      t.integer :marks
      t.integer :estimated_minutes
      t.boolean :is_parameterizable, null: false, default: false
      t.string :item_type
      t.integer :difficulty_nominal
      t.string :content_hash
      t.integer :usage_count, null: false, default: 0
      t.references :department, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.references :parent, null: true, foreign_key: { to_table: :items }
      t.integer :node_type, null: false, default: 0
      t.integer :status, null: false, default: 0

      t.timestamps
    end
    add_index :items, [:department_id, :status]
    add_index :items, [:department_id, :created_at]
    add_index :items, :status, where: "status = 3", name: "index_items_on_status_approved"
    add_index :items, :content_hash
  end
end
