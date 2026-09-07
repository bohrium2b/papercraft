# Multi-Tenant Organization & Authentication Plan

## Feature Intent

Papercraft mirrors how real educational institutions are structured: a top-level organization (a school district or examination board) contains sub-organizations (individual schools or campuses), which contain departments (Mathematics, Physics, etc.). Every user belongs to an organization and has a primary department, with optional additional department memberships.

Instead of a heavy RBAC matrix, Papercraft uses a single `can_approve` boolean on the `UserDepartment` join table. Most users are Item Authors or Teachers who create and edit items. A smaller set of Senior Examiners and Department Admins hold the `can_approve` flag, which gates item approval, exam finalisation, and archival. This keeps the permission model simple enough that a school administrator can assign roles in minutes, not hours.

Authentication is handled by Sorcery for email/password, with optional SAML 2.0 and OIDC SSO for institutions that use Azure AD or Google Workspace. SSO users are auto-provisioned on first login and can link to local accounts.

The platform does **not** enforce data isolation between departments. Department is a metadata label used for default views, filtering, and template selection — not a security boundary. This reflects the trust model of most schools, where teachers are allowed to browse colleagues' items for reuse.

## Data Model

### Organization Hierarchy
```ruby
class Organization < ApplicationRecord
  has_many :departments
  # columns: name
end

class Department < ApplicationRecord
  belongs_to :organization
  # columns: name, latex_preamble (text), mark_scheme_config (jsonb), template_config (jsonb)
  has_many :items
  has_many :blueprints
  has_many :exams
  has_many :document_templates
  has_many :diagrams
end
```

`department_id` is a **metadata label, not a security boundary**. Users can browse and access resources across all departments within their organization. Department scoping is used for filtering, grouping, and default views only.

### Users
```ruby
class User < ApplicationRecord
  belongs_to :department   # primary department for default view
  # Sorcery columns: email, encrypted_password, etc.
  # columns: name, can_approve (boolean, default false)
  has_many :owned_items, class_name: "Item", foreign_key: "author_id"
  has_many :item_transitions, class_name: "ItemRevisionTransition", foreign_key: "reviewer_id"
end

class UserDepartment < ApplicationRecord
  belongs_to :user
  belongs_to :department
  # columns: can_approve (boolean)
  # Records which departments a user belongs to and their approval authority in each.
  # A user's primary department is stored on User#department_id.
  # Additional department memberships are recorded here.
end
```

`can_approve` is the only permission flag in the system. It gates item approval and exam finalisation. There is no role hierarchy, no resource-level access control, and no data isolation between departments.

### Tenancy
- **No row-level scoping enforcement.** Queries do not automatically filter by `department_id`.
- **Current department** set via subdomain (`<dept>.papercraft.app`) or header (`X-Papercraft-Department`) for API, used to set the user's default view context.
- Department is a first-class dimension for filtering item banks, taxonomy selection, and template selection.

## Authentication

### Primary: Sorcery
- Local email/password with password reset
- Session management via encrypted cookies
- Remember me tokens

### SSO Integration
- **SAML 2.0:** via `omniauth-saml` (Azure AD, Google Workspace)
- **OIDC:** via `omniauth-openid-connect`
- **Auto-provisioning:** SSO users auto-created with default department from IdP metadata
- **Link accounts:** Local + SSO mapped to same user record

## Locking

### Pessimistic Tree Locking
```ruby
class Lock < ApplicationRecord
  # columns: lock_key (string, indexed unique), resource_type, resource_id,
  #          user_id, expires_at (datetime)
  # Locking a resource also locks all descendants.
  # Viewing a locked resource is always allowed; writing is blocked.
end
```

Lock scope is the **resource tree**, not the single record:
- Locking a blueprint locks all items within it
- Locking an item locks all its children (parts, sub-parts)
- Locking is advisory at the DB level with application enforcement

Implementation:
```ruby
def with_tree_lock(resource, user:)
  keys = Lock.tree_lock_keys_for(resource)
  locks = keys.map { |k| Lock.acquire!(k, user: user, expires: 2.hours) }
  yield
ensure
  locks.each(&:release!)
end
```

`Lock.acquire!` raises if a non-expired lock already exists. The 2-hour TTL prevents stale locks from crashed sessions.

## Audit Logging (Lightweight)

### Approval History Only
```ruby
class ItemRevisionTransition < ApplicationRecord
  belongs_to :item
  belongs_to :reviewer, class_name: "User", optional: true
  # columns: from_status, to_status, comment, created_at
end
```

Audit logging is restricted to **item review transitions** (submit, approve, request revisions). There is no global audit callback on `ApplicationRecord`. The transition record captures who performed the action and when; the state snapshot lives in `ItemVersion`.

## API Design

### Rails API Mode
- Namespaced under `/api/v1`
- Session cookie auth (no JWT — cookies work for both SPA navigation and API calls)
- CORS restricted to frontend origin
- JSON:API spec for consistency

### React Frontend Integration
- Axios or TanStack Query for data fetching
- Auth state via React context + session cookies
- MUI `ThemeProvider` with institutional branding colours

## Security Hardening
- **Rate limiting:** Rack::Attack (per IP, per user)
- **CSRF:** Standard Rails CSRF tokens
- **XSS:** Content-Security-Policy via SecureHeaders gem
- **SQL Injection:** Parameterized queries (ActiveRecord)
- **Password hashing:** bcrypt (cost 12)

## Migration Plan
1. Organizations + Departments (seed data)
2. Users + UserDepartment (Sorcery)
3. SSO (post-MVP)
4. Item model + tree structure
5. Locking infrastructure
6. Item revision transitions + versioning
