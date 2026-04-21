# RBAC System Test Guide

## Component Test Scenarios

### 1. Permission Guard Component
**File**: `src/components/RBAC/PermissionGuard.tsx`

#### Test Case 1.1: Single Permission Check
```typescript
<PermissionGuard permission="team:manage">
  <AdminPanel />
</PermissionGuard>
```
**Users to test**:
- Owner: ✅ Should see panel
- Admin: ✅ Should see panel
- Manager: ❌ Should see fallback
- Viewer: ❌ Should see fallback

#### Test Case 1.2: Multiple Permissions (ANY)
```typescript
<PermissionGuard permission={['team:manage', 'billing:manage']}>
  <SensitiveContent />
</PermissionGuard>
```
**Expected**: Shows if user has ANY of the permissions

#### Test Case 1.3: Multiple Permissions (ALL)
```typescript
<PermissionGuard 
  permission={['submissions:write', 'team:manage']}
  requireAll={true}
>
  <Content />
</PermissionGuard>
```
**Expected**: Shows only if user has ALL permissions

---

### 2. Role Selector Component
**File**: `src/components/RBAC/RoleSelector.tsx`

#### Test Case 2.1: Owner Selecting Roles
```typescript
const currentUser = { role: 'owner' };
<RoleSelector value={role} onChange={setRole} />
```
**Expected Options**:
- Admin ✅
- Manager ✅
- Viewer ✅
- Owner (self) ❌ Not available

#### Test Case 2.2: Admin Selecting Roles
```typescript
const currentUser = { role: 'admin' };
<RoleSelector value={role} onChange={setRole} />
```
**Expected Options**:
- Admin (self) ❌
- Manager ✅
- Viewer ✅
- Owner ❌ Cannot assign higher role

#### Test Case 2.3: Manager Selecting Roles
```typescript
const currentUser = { role: 'manager' };
<RoleSelector value={role} onChange={setRole} />
```
**Expected**: Empty with error message "You cannot assign roles"

---

### 3. Role Modal Component
**File**: `src/components/RBAC/RoleModal.tsx`

#### Test Case 3.1: Owner Changing Admin to Manager
```typescript
// Owner editing Admin user
currentRole="admin"
onConfirm={(role) => updateRole(role)}
```
**Expected Flow**:
1. Modal shows "Change Member Role"
2. Current Role: "Admin" displayed
3. Can select: Manager, Viewer
4. Click "Update Role"
5. Success message shown
6. Audit log created

#### Test Case 3.2: Admin Cannot Edit Owner
```typescript
// Admin trying to edit Owner user
currentRole="owner"
onConfirm={(role) => updateRole(role)}
```
**Expected**:
- Warning message shows
- "Update Role" button disabled
- Cannot change role

#### Test Case 3.3: Role Not Changed
```typescript
// User selects same role
oldRole="viewer"
newRole="viewer" (selected)
```
**Expected**:
- "Update Role" button disabled
- No API call made
- No audit log

---

### 4. Team Members Table Component
**File**: `src/components/RBAC/TeamMembersTable.tsx`

#### Test Case 4.1: Owner View
```typescript
<TeamMembersTable members={members} currentUserId={userId} />
```
**Expected**:
- See all team members
- Edit button for each non-owner member
- Delete button for each non-owner member
- Can manage any role below owner level

#### Test Case 4.2: Manager View
```typescript
// Manager user
<TeamMembersTable members={members} currentUserId={userId} />
```
**Expected**:
- See team members list
- No edit/delete buttons (even for viewers)
- Read-only view
- PermissionGuard hides action buttons

#### Test Case 4.3: Current User Highlighted
```typescript
// User viewing their own entry
userId="john123"
<TeamMembersTable currentUserId="john123" />
```
**Expected**:
- Current user's row highlighted in blue
- Shows "You" label
- No edit/delete buttons on own row

#### Test Case 4.4: Loading State
```typescript
<TeamMembersTable isLoading={true} />
```
**Expected**: Spinner shown in center

#### Test Case 4.5: Empty State
```typescript
<TeamMembersTable members={[]} />
```
**Expected**: Message "No team members yet."

---

### 5. Role Indicator Component
**File**: `src/components/RBAC/RoleIndicator.tsx`

#### Test Case 5.1: Color Coding
**Setup**: Display indicator for each role
- Owner: Purple background
- Admin: Blue background
- Manager: Green background
- Viewer: Gray background

#### Test Case 5.2: Label Display
```typescript
<RoleIndicator showLabel={true} />  // "Owner"
<RoleIndicator showLabel={false} /> // "OWNER"
```

---

### 6. Permission Hook Tests
**File**: `src/hooks/usePermissions.ts`

#### Test Case 6.1: hasPermissionTo
```typescript
const { hasPermissionTo } = usePermissions();
const can = hasPermissionTo('team:manage');
```
**Expected Results**:
- Owner: ✅ true
- Admin: ✅ true
- Manager: ❌ false
- Viewer: ❌ false

#### Test Case 6.2: canManage
```typescript
const { canManage } = usePermissions();
const canManageManager = canManage('manager'); // Admin checking if can manage Manager
```
**Expected**:
- Owner managing Admin: ✅ true
- Admin managing Manager: ✅ true
- Manager managing Viewer: ❌ false
- Viewer managing Anyone: ❌ false

#### Test Case 6.3: canAssignRoles
```typescript
const { canAssignRoles } = usePermissions();
const roles = canAssignRoles();
```
**Expected**:
- Owner: ['admin', 'manager', 'viewer']
- Admin: ['manager', 'viewer']
- Manager: []
- Viewer: []

#### Test Case 6.4: isHigherOrEqual
```typescript
const { isHigherOrEqual } = usePermissions();
const result = isHigherOrEqual('viewer');
```
**Expected**:
- Owner vs Viewer: ✅ true
- Admin vs Admin: ✅ true
- Manager vs Admin: ❌ false

---

### 7. Team Management Page
**File**: `src/pages/Team/TeamManagement.tsx`

#### Test Case 7.1: Full Owner Experience
**User**: Owner
**Expected**:
1. See "Your Role: Owner" badge
2. See "Invite Team Member" form
3. RoleSelector shows all 4 roles
4. Can edit any team member's role
5. Can remove any team member
6. See pending invitations

#### Test Case 7.2: Admin Experience
**User**: Admin
**Expected**:
1. See "Your Role: Admin" badge
2. See "Invite Team Member" form
3. RoleSelector shows only Manager, Viewer
4. Can edit Manager and Viewer roles
5. Cannot edit Owner or other Admin
6. Cannot remove Owner

#### Test Case 7.3: Manager Experience
**User**: Manager
**Expected**:
1. See "Your Role: Manager" badge
2. NO "Invite Team Member" form
3. See team list (read-only)
4. No edit/delete buttons visible
5. Permission denied message shown for invite section

#### Test Case 7.4: Viewer Experience
**User**: Viewer
**Expected**:
1. See "Your Role: Viewer" badge
2. Page redirect or permission denied
3. Cannot access team management
4. See only read-only analytics

#### Test Case 7.5: Error Handling
**Trigger**: Network error during role change
**Expected**:
1. Error message displayed
2. Table still shows old role
3. Retry possible
4. Toast notification fades after 3 seconds

---

## Firestore Rules Test Cases

### Test Case 8.1: User Reading Own Document
```
User: john@example.com
Action: Read /users/john_uid
Expected: ✅ ALLOW
```

### Test Case 8.2: Admin Reading Team Member Document
```
User: admin@example.com (role: admin)
Action: Read /users/viewer_uid (same company)
Expected: ✅ ALLOW
```

### Test Case 8.3: Viewer Reading Company Document
```
User: viewer@example.com
Action: Read /companies/company_id
Expected: ❌ DENY (only admin+ can read)
```

### Test Case 8.4: Manager Creating Submission
```
User: manager@example.com
Action: Create /submissions/new
Expected: ✅ ALLOW
```

### Test Case 8.5: Viewer Deleting Submission
```
User: viewer@example.com
Action: Delete /submissions/sub_123
Expected: ❌ DENY (read-only)
```

### Test Case 8.6: Manager Updating Submission Reply Only
```
User: manager@example.com
Action: Update publicReply, publicReplyAt, publicReplyBy only
Expected: ✅ ALLOW
Rule: only(['publicReply', 'publicReplyAt', 'publicReplyBy'])
```

### Test Case 8.7: Manager Trying to Change Status
```
User: manager@example.com
Action: Update status field (in addition to reply)
Expected: ❌ DENY
```

---

## Cloud Functions API Test Cases

### Test Case 9.1: Update Member Role
```bash
PUT /api/team/company_123/members/user_456/role
Authorization: Bearer {token}
Body: { "newRole": "manager" }
```
**Test Matrix**:
| User Role | Target Role | New Role | Expected |
|-----------|------------|----------|----------|
| Owner | Admin | Manager | 200 OK |
| Owner | Owner | Admin | 400 (last owner) |
| Admin | Manager | Viewer | 200 OK |
| Admin | Admin | Viewer | 403 (cannot manage equal) |
| Manager | Viewer | Admin | 403 (no permission) |

### Test Case 9.2: Remove Member
```bash
DELETE /api/team/company_123/members/user_456
Authorization: Bearer {token}
```
**Test Matrix**:
| User Role | Target Role | Expected |
|-----------|------------|----------|
| Owner | Admin | 200 OK |
| Owner | Owner | 400 (last owner) |
| Admin | Manager | 200 OK |
| Manager | Viewer | 403 (no permission) |

### Test Case 9.3: Audit Log Retrieval
```bash
GET /api/team/company_123/audit-logs?limit=50
Authorization: Bearer {token}
```
**Expected**:
- Owner/Admin: 200 OK with logs
- Manager/Viewer: 403 DENY
- Logs sorted by timestamp DESC
- Max 50 per page

---

## End-to-End User Flows

### Flow 1: Onboarding New Team Member
```
1. Owner invites alice@example.com as Manager
2. Invitation email sent (future feature)
3. Alice accepts invitation
4. Alice logs in as Manager
5. Alice sees submissions, can assign/reply
6. Alice cannot see team management
7. Owner views audit log: "member_added"
```

### Flow 2: Promote Manager to Admin
```
1. Owner views team page
2. Owner sees Manager "Bob"
3. Owner clicks edit button
4. Modal shows current role: Manager
5. Owner selects Admin
6. Owner confirms
7. Bob's role changed to Admin
8. Audit log: "role_changed" Admin
9. Bob sees new features on next refresh
```

### Flow 3: Prevent Privilege Escalation
```
1. Admin tries to make themselves Owner
2. RoleSelector doesn't show Owner option
3. If somehow Admin gets higher permissions
4. Firestore rules deny the write
5. Cloud Functions validates and returns 403
6. Audit attempt logged
```

### Flow 4: Protect Last Owner
```
1. Company has 1 Owner (Jane)
2. Owner removes all Admins
3. Owner tries to delete themselves
4. Delete endpoint returns error
5. Message: "Cannot remove the last owner"
6. Jane remains as Owner
```

---

## Integration Checklist

- [ ] RBAC types added to `src/types/index.ts`
- [ ] RBAC library created at `src/lib/rbac.ts`
- [ ] usePermissions hook works correctly
- [ ] All 5 RBAC components render without errors
- [ ] PermissionGuard hides content correctly
- [ ] RoleSelector shows assignable roles only
- [ ] RoleModal validation works
- [ ] TeamMembersTable displays members
- [ ] TeamManagement page uses new components
- [ ] Firestore rules deployed and tested
- [ ] Cloud Functions middleware validates roles
- [ ] Team endpoints return correct responses
- [ ] Audit logs created on role changes
- [ ] Error messages display properly
- [ ] Permission denied fallbacks shown
- [ ] Role colors consistent across components
- [ ] Loading states working
- [ ] Empty states handled
- [ ] Responsive design on mobile
- [ ] Accessibility: ARIA labels present

---

## Performance Testing

### Load Test: Bulk Invite
- Invite 100 users at once
- Expected: < 5s total
- Audit logs created for each

### Load Test: Fetch Team
- Company with 500 members
- Expected: < 2s load time
- Pagination working

### Database Test: Audit Logs
- 10k audit entries
- Query performance: < 1s
- Indexes applied correctly

---

## Security Testing

### Test Case: Direct Firestore Write
```
User: Viewer
Action: Direct Firestore write to submissions
Expected: ❌ DENY by security rules
```

### Test Case: API Without Token
```
Request: /api/team/123/members/456/role
No Authorization header
Expected: 401 Unauthorized
```

### Test Case: Modified Token
```
Token: Tampered with different role
Request: Change role to Owner
Expected: 403 Forbidden (signature invalid)
```

### Test Case: SQL Injection in Role
```
Body: { "newRole": "admin' OR '1'='1" }
Expected: 400 Invalid role
Valid roles: owner, admin, manager, viewer only
```

---

## Deployment Verification

Run these checks before deploying to production:

```bash
# 1. Type checking
npm run type-check

# 2. Lint RBAC code
npm run lint src/lib/rbac.ts
npm run lint src/components/RBAC/
npm run lint src/hooks/usePermissions.ts

# 3. Test components
npm run test -- PermissionGuard
npm run test -- RoleSelector
npm run test -- TeamMembersTable

# 4. Deploy and verify rules
firebase deploy --only firestore:rules

# 5. Deploy functions
firebase deploy --only functions

# 6. Smoke test
- Login as each role type
- Verify UI elements visible/hidden correctly
- Test role change API
- Check audit logs

# 7. Production checklist
- [ ] No console errors
- [ ] Permission guards working
- [ ] Firestore rules enforced
- [ ] Audit logs created
- [ ] Backups created
- [ ] Rollback plan ready
```
