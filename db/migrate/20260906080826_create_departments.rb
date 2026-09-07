class CreateDepartments < ActiveRecord::Migration[8.1]
  def change
    create_table :departments do |t|
      t.string :name, null: false
      t.references :organization, null: false, foreign_key: true
      t.text :latex_preamble
      t.jsonb :mark_scheme_config, default: {}
      t.jsonb :template_config, default: {}

      t.timestamps
    end
    add_index :departments, [:organization_id, :name]
  end
end
