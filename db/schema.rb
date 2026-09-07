# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_07_070851) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "departments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "latex_preamble"
    t.jsonb "mark_scheme_config", default: {}
    t.string "name", null: false
    t.bigint "organization_id", null: false
    t.jsonb "template_config", default: {}
    t.datetime "updated_at", null: false
    t.index ["organization_id", "name"], name: "index_departments_on_organization_id_and_name"
    t.index ["organization_id"], name: "index_departments_on_organization_id"
  end

  create_table "item_revision_transitions", force: :cascade do |t|
    t.text "comment"
    t.datetime "created_at", null: false
    t.string "from_status"
    t.bigint "item_id", null: false
    t.bigint "reviewer_id"
    t.string "to_status"
    t.datetime "updated_at", null: false
    t.index ["item_id"], name: "index_item_revision_transitions_on_item_id"
    t.index ["reviewer_id"], name: "index_item_revision_transitions_on_reviewer_id"
  end

  create_table "item_versions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "item_id", null: false
    t.jsonb "snapshot_json"
    t.datetime "updated_at", null: false
    t.string "version_string"
    t.index ["item_id"], name: "index_item_versions_on_item_id"
  end

  create_table "items", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.string "content_hash"
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.integer "difficulty_nominal"
    t.integer "estimated_minutes"
    t.boolean "is_parameterizable", default: false, null: false
    t.string "item_type"
    t.integer "marks"
    t.integer "node_type", default: 0, null: false
    t.bigint "parent_id"
    t.text "prompt_html"
    t.integer "status", default: 0, null: false
    t.text "stimulus_html"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "usage_count", default: 0, null: false
    t.index ["author_id"], name: "index_items_on_author_id"
    t.index ["content_hash"], name: "index_items_on_content_hash"
    t.index ["department_id", "created_at"], name: "index_items_on_department_id_and_created_at"
    t.index ["department_id", "status"], name: "index_items_on_department_id_and_status"
    t.index ["department_id"], name: "index_items_on_department_id"
    t.index ["parent_id"], name: "index_items_on_parent_id"
    t.index ["status"], name: "index_items_on_status_approved", where: "(status = 3)"
  end

  create_table "locks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "lock_key", null: false
    t.integer "resource_id", null: false
    t.string "resource_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["lock_key"], name: "index_locks_on_lock_key", unique: true
    t.index ["resource_type", "resource_id"], name: "index_locks_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_locks_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_organizations_on_name"
  end

  create_table "user_departments", force: :cascade do |t|
    t.boolean "can_approve", default: false, null: false
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["department_id"], name: "index_user_departments_on_department_id"
    t.index ["user_id", "department_id"], name: "index_user_departments_on_user_id_and_department_id", unique: true
    t.index ["user_id"], name: "index_user_departments_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "can_approve", default: false, null: false
    t.datetime "created_at", null: false
    t.string "crypted_password"
    t.bigint "department_id", null: false
    t.string "email", null: false
    t.string "name"
    t.string "salt"
    t.datetime "updated_at", null: false
    t.index ["department_id"], name: "index_users_on_department_id"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "departments", "organizations"
  add_foreign_key "item_revision_transitions", "items"
  add_foreign_key "item_revision_transitions", "users", column: "reviewer_id"
  add_foreign_key "item_versions", "items"
  add_foreign_key "items", "departments"
  add_foreign_key "items", "items", column: "parent_id"
  add_foreign_key "items", "users", column: "author_id"
  add_foreign_key "locks", "users"
  add_foreign_key "user_departments", "departments"
  add_foreign_key "user_departments", "users"
  add_foreign_key "users", "departments"
end
