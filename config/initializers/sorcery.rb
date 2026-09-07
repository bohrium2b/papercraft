Rails.application.config.sorcery.submodules = [:core, :reset_password]

Rails.application.config.sorcery.configure do |config|
  config.not_authenticated_action = :not_authenticated
  config.use_redirect_back_or_to_by_rails = true

  config.user_config do |user|
    user.stretches = 1 if Rails.env.test?
    user.email_attribute_name = :email
    user.crypted_password_attribute_name = :crypted_password

    user.reset_password_token_attribute_name = :reset_password_token
    user.reset_password_token_expires_at_attribute_name = :reset_password_token_expires_at
    user.reset_password_email_sent_at_attribute_name = :reset_password_email_sent_at
    user.reset_password_email_method_name = :reset_password_email
    user.reset_password_mailer_disabled = true
    user.reset_password_expiration_period = 2.days.to_i
  end

  config.user_class = "User"
end
