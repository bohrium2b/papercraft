require "test_helper"

class Api::V1::LocksControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get api_v1_locks_create_url
    assert_response :success
  end

  test "should get destroy" do
    get api_v1_locks_destroy_url
    assert_response :success
  end
end
