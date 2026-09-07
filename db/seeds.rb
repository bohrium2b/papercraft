org = Organization.find_or_create_by!(name: "Demo School District")

math_dept = Department.find_or_create_by!(name: "Mathematics", organization: org)
physics_dept = Department.find_or_create_by!(name: "Physics", organization: org)

admin = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.name = "Admin User"
  u.password = "password123"
  u.department = math_dept
  u.can_approve = true
end

teacher = User.find_or_create_by!(email: "teacher@example.com") do |u|
  u.name = "Teacher User"
  u.password = "password123"
  u.department = math_dept
  u.can_approve = false
end

UserDepartment.find_or_create_by!(user: admin, department: math_dept) { |ud| ud.can_approve = true }
UserDepartment.find_or_create_by!(user: teacher, department: math_dept) { |ud| ud.can_approve = false }
UserDepartment.find_or_create_by!(user: admin, department: physics_dept) { |ud| ud.can_approve = true }
