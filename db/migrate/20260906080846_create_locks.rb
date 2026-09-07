class CreateLocks < ActiveRecord::Migration[8.1]
  def change
    create_table :locks do |t|
      t.string :lock_key, null: false
      t.string :resource_type, null: false
      t.integer :resource_id, null: false
      t.references :user, null: false, foreign_key: true
      t.datetime :expires_at, null: false

      t.timestamps
    end
    add_index :locks, :lock_key, unique: true
    add_index :locks, [:resource_type, :resource_id]
  end
end
