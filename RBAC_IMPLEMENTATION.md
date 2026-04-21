# RBAC System Implementation Guide

## Overview
Complete role-based access control (RBAC) system for FeedSolve with four roles: Owner, Admin, Manager, and Viewer.

## Role Definitions

### Owner (Full Access)
- Full control over company
- Manage team members (invite, remove, change roles)
- Manage billing and company settings
- Can delete company
- View all submissions and analytics
- Configure integrations and webhooks
- Cannot be removed (at least one required)

### Admin
- Manage submissions (CRUD operations)
- Manage team members (invite, remove, change roles - except owner)
- Configure webhooks and integrations
- View analytics and team
- Cannot: delete company, manage billing, manage other admins

### Manager
- View and manage submissions
- Assign submissions to team members
- Reply to submitters
- View analytics
- Cannot: manage team, configure webhooks, delete submissions

### Viewer
- Read-only access to submissions
- View analytics
- No write permissions on submissions

## Files Modified/Created

### Types (`src/types/index.ts`)
- Updated `User` interface to support all four roles
- Added `UserRole` type
- Added `PermissionAuditLog` interface for permission tracking

### RBAC Library (`src/lib/rbac.ts`)
- Permission definitions for all roles
- Role hierarchy and helper functions
- Permission checking utilities

### Custom Hooks

#### `src/hooks/usePermissions.ts`
```typescript
const { hasPermissionTo, canManage, canAssignRoles, isHigherOrEqual } = usePermissions();
```

### Components

#### `src/components/RBAC/PermissionGuard.tsx`
Wrapper component to show/hide UI based on permissions:
```typescript
<PermissionGuard permission="team:manage">
  <AdminPanel />
</PermissionGuard>
```

#### `src/components/RBAC/RoleIndicator.tsx`
Display current user's role with color coding.

#### `src/components/RBAC/RoleSelector.tsx`
Radio button group for selecting roles during invitations. Only shows roles the current user can assign.

#### `src/components/RBAC/RoleModal.tsx`
Modal for changing team member roles with confirmation and validation.

#### `src/components/RBAC/TeamMembersTable.tsx`
Enhanced table displaying team members with role management actions.

### Firestore Security Rules (`firestore.rules`)
- Role-based read/write permissions
- Prevents unauthorized access at database level
- Protects team management and company settings
- Prevents removing last owner

### Cloud Functions

#### `functions/src/middleware/rbac.ts`
- `verifyRBAC`: Middleware to authenticate and load user role
- `requirePermission`: Enforce specific permissions
- `requireRole`: Enforce specific roles
- `auditLog`: Log all permission changes
- `canManageRole`: Check role hierarchy

#### `functions/src/routes/team.ts`
API endpoints:
- `GET /team/:companyId/members` - List team members
- `PUT /team/:companyId/members/:userId/role` - Update role
- `DELETE /team/:companyId/members/:userId` - Remove member
- `GET /team/:companyId/audit-logs` - View permission audit trail

#### `functions/src/types.ts`
TypeScript interfaces for Cloud Functions

## Migration Guide for Existing Companies

### Step 1: Database Migration
Run migration script to update existing users:

```javascript
// Migrate existing 'admin' users to 'owner' (company creators)
db.collection('users').where('companyId', '==', companyId)
  .where('role', '==', 'admin')
  .limit(1)
  .get()
  .then(snapshot => {
    snapshot.docs[0].ref.update({ role: 'owner' });
  });

// Keep other 'admin' users as 'admin'
// Set all 'member' users to 'viewer' (conservative approach)
db.collection('users').where('role', '==', 'member')
  .get()
  .then(snapshot => {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { role: 'viewer' });
    });
    return batch.commit();
  });
```

### Step 2: Update Firestore Rules
Deploy updated `firestore.rules` with new role checks.

### Step 3: Deploy Cloud Functions
Deploy team management endpoints with RBAC middleware.

### Step 4: Update Frontend
- Replace old role selection with new RoleSelector
- Use PermissionGuard for conditional rendering
- Update TeamManagement page to use new components

## Permission Matrix

| Permission | Owner | Admin | Manager | Viewer |
|-----------|-------|-------|---------|--------|
| submissions:read | ✅ | ✅ | ✅ | ✅ |
| submissions:create | ✅ | ✅ | ✅ | ❌ |
| submissions:update | ✅ | ✅ | ✅ | ❌ |
| submissions:delete | ✅ | ✅ | ❌ | ❌ |
| submissions:assign | ✅ | ✅ | ✅ | ❌ |
| submissions:reply | ✅ | ✅ | ✅ | ❌ |
| team:read | ✅ | ✅ | ✅ | ❌ |
| team:invite | ✅ | ✅ | ❌ | ❌ |
| team:manage | ✅ | ✅ | ❌ | ❌ |
| team:remove | ✅ | ✅ | ❌ | ❌ |
| webhooks:read | ✅ | ✅ | ❌ | ❌ |
| webhooks:write | ✅ | ✅ | ❌ | ❌ |
| integrations:read | ✅ | ✅ | ❌ | ❌ |
| integrations:write | ✅ | ✅ | ❌ | ❌ |
| analytics:read | ✅ | ✅ | ✅ | ✅ |
| company:read | ✅ | ✅ | ❌ | ❌ |
| company:update | ✅ | ❌ | ❌ | ❌ |
| company:delete | ✅ | ❌ | ❌ | ❌ |
| billing:read | ✅ | ❌ | ❌ | ❌ |
| billing:manage | ✅ | ❌ | ❌ | ❌ |
| audit:read | ✅ | ✅ | ✅ | ❌ |

## Implementation Details

### Role Hierarchy
- Owner (4) > Admin (3) > Manager (2) > Viewer (1)
- Users can only manage roles below their own level
- Prevents privilege escalation

### Audit Logging
All role changes are logged with:
- User making change
- Target user
- Old role and new role
- Timestamp
- Action type

Access logs: `companies/{companyId}/audit_logs/{logId}`

### Owner Protection
- At least one owner must exist per company
- Cannot remove last owner
- Cannot change owner to different role
- Cannot delete company with active owner

## Testing Scenarios

### Scenario 1: Owner Inviting Members
```
User: Owner
Action: Invite Manager
Expected: Can select any role (Admin, Manager, Viewer)
Result: Invitation sent with selected role
```

### Scenario 2: Admin Changing Manager Role
```
User: Admin
Target: Manager
Action: Change Manager to Viewer
Expected: Modal shows current role is "Manager"
Expected: Cannot select Admin or Owner
Result: Role changed to Viewer, audit logged
```

### Scenario 3: Manager Accessing Team Page
```
User: Manager
Action: Access Team Management
Expected: Cannot see invite form
Expected: Cannot see role change options
Expected: Can only view team list
Result: Permission denied messages shown
```

### Scenario 4: Viewer Reading Submissions
```
User: Viewer
Action: Try to create submission
Expected: Cannot see create button
Expected: Cannot make API call
Expected: Read-only mode
Result: PermissionGuard hides create UI
```

### Scenario 5: Protecting Last Owner
```
User: Owner A (only owner)
Target: Owner A
Action: Try to change role to Admin
Expected: Error message
Expected: Cannot proceed
Result: Error: "Cannot remove the last owner"
```

## API Integration

### Frontend to Cloud Functions
```typescript
// Update member role
await fetch('/api/team/123/members/user456/role', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ newRole: 'manager' })
});

// Get audit logs
const response = await fetch('/api/team/123/audit-logs?limit=50', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Firestore Rules Integration
- All role checks happen at database level
- Cloud Functions act as additional validation
- Frontend respects permission guards

## Security Considerations

1. **Role Checks on Two Levels**
   - Frontend: PermissionGuard for UX
   - Firestore Rules: Data protection
   - Cloud Functions: API validation

2. **Audit Trail**
   - Every role change is logged
   - Prevents unauthorized modifications
   - Helps detect suspicious activity

3. **Role Hierarchy**
   - Prevents privilege escalation
   - Users cannot assign higher roles than their own
   - Protects owner role from being removed

4. **Data Validation**
   - Cloud Functions validate role changes
   - Prevent direct Firestore modifications
   - Check user exists before modification

## Troubleshooting

### User Can See UI But Cannot Act
Check:
- Frontend: PermissionGuard is hiding actions? ✅
- Firestore Rules: Denying write access? ✅
- Cloud Functions: Returning 403? ✅

### Invitation Not Sending
Check:
- User has `team:invite` permission
- Email is valid
- Company exists
- Cloud Function deployed

### Audit Logs Empty
Check:
- Firestore collection exists
- Cloud Function writing logs
- User has `audit:read` permission

## Future Enhancements

1. **Custom Roles**: Allow companies to define custom roles
2. **Role Templates**: Pre-configured role bundles
3. **Temporary Access**: Time-limited role grants
4. **Delegation**: Allow admins to delegate specific permissions
5. **SSO Integration**: Map LDAP/SAML groups to roles
6. **Audit Retention**: Archive old audit logs
7. **Role Analytics**: Usage patterns of each role

## Configuration

### Add to `firebase.json`
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### Environment Variables
```bash
# functions/.env
RBAC_ENABLED=true
AUDIT_LOG_ENABLED=true
```

## Deployment Checklist

- [ ] Update types in `src/types/index.ts`
- [ ] Create RBAC library and hooks
- [ ] Create RBAC components
- [ ] Deploy updated Firestore rules
- [ ] Deploy Cloud Functions with team routes
- [ ] Update TeamManagement page
- [ ] Run migration script for existing companies
- [ ] Test all four roles
- [ ] Verify audit logs working
- [ ] Check Firestore rules restrictions
