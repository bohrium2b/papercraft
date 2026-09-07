class CreateItemVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :item_versions do |t|
      t.references :item, null: false, foreign_key: true
      t.string :version_string
      t.jsonb :snapshot_json

      t.timestamps
    end
  end
end
