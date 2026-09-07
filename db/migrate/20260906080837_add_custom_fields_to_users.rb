class AddCustomFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string
    add_reference :users, :department, null: false, foreign_key: true
    add_column :users, :can_approve, :boolean, null: false, default: false
  end
end
