require "test_helper"

class Api::V1::ItemRevisionTransitionsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_item_revision_transitions_index_url
    assert_response :success
  end

  test "should get create" do
    get api_v1_item_revision_transitions_create_url
    assert_response :success
  end
end
