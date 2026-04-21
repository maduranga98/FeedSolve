# RBAC Integration Guide

## Quick Start

### 1. Import RBAC Components and Hooks

```typescript
// In any React component
import { PermissionGuard, PermissionDenied } from '../components/RBAC/PermissionGuard';
import { RoleIndicator } from '../components/RBAC/RoleIndicator';
import { usePermissions } from '../hooks/usePermissions';
```

### 2. Basic Permission Check

```typescript
export function SubmissionActions() {
  const { hasPermissionTo } = usePermissions();

  if (!hasPermissionTo('submissions:write')) {
    return <PermissionDenied message="You cannot edit submissions" />;
  }

  return (
    <div>
      <button>Edit Submission</button>
    </div>
  );
}
```

### 3. Conditional Rendering

```typescript
export function Dashboard() {
  return (
    <div>
      {/* Show admin panel only to owners and admins */}
      <PermissionGuard permission={['company:delete', 'billing:manage']}>
        <AdminPanel />
      </PermissionGuard>

      {/* Show team management only to admins+ */}
      <PermissionGuard permission="team:manage">
        <TeamManagement />
      </PermissionGuard>

      {/* Show analytics to everyone */}
      <PermissionGuard permission="analytics:read">
        <Analytics />
      </PermissionGuard>
    </div>
  );
}
```

---

## Integration by Feature

### Submissions Feature

**File**: `src/pages/Submission/`

#### Show Create Button
```typescript
import { PermissionGuard } from '../components/RBAC/PermissionGuard';

export function SubmissionList() {
  return (
    <div>
      <PermissionGuard permission="submissions:create">
        <button>+ New Submission</button>
      </PermissionGuard>

      {/* Submission list always visible to readers */}
      <SubmissionTable />
    </div>
  );
}
```

#### Show Edit/Delete Actions
```typescript
export function SubmissionRow({ submission }) {
  const { hasPermissionTo } = usePermissions();

  return (
    <tr>
      <td>{submission.title}</td>
      <td>
        {hasPermissionTo('submissions:update') && (
          <button>Edit</button>
        )}
        {hasPermissionTo('submissions:delete') && (
          <button>Delete</button>
        )}
      </td>
    </tr>
  );
}
```

#### Show Reply Feature
```typescript
export function SubmissionDetail({ submission }) {
  return (
    <div>
      <h2>{submission.subject}</h2>
      <p>{submission.description}</p>

      <PermissionGuard 
        permission="submissions:reply"
        fallback={<p>You cannot reply to this submission</p>}
      >
        <ReplyForm submissionId={submission.id} />
      </PermissionGuard>
    </div>
  );
}
```

#### Show Assignment Feature
```typescript
export function AssignmentControl({ submission }) {
  return (
    <PermissionGuard permission="submissions:assign">
      <select 
        value={submission.assignedTo}
        onChange={(e) => updateAssignment(submission.id, e.target.value)}
      >
        <option value="">Unassigned</option>
        {teamMembers.map(member => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>
    </PermissionGuard>
  );
}
```

---

### Team Management Feature

**File**: `src/pages/Team/TeamManagement.tsx` (Already updated)

#### How It Works
- PermissionGuard wraps invite form → Only shows to team:invite permission
- RoleSelector only displays assignable roles
- RoleModal prevents managing higher roles
- TeamMembersTable shows/hides action buttons based on permissions

#### Usage Example
```typescript
export function TeamManagement() {
  const { user } = useAuth();

  return (
    <div>
      <RoleIndicator />
      
      <PermissionGuard permission="team:invite">
        <InviteForm />
      </PermissionGuard>

      <TeamMembersTable 
        members={members}
        currentUserId={user.id}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemove}
      />
    </div>
  );
}
```

---

### Integrations Feature

**File**: `src/pages/Integrations/`

```typescript
export function IntegrationsList() {
  return (
    <PermissionGuard 
      permission={['integrations:read']}
      fallback={<PermissionDenied message="Integration management not available for your role" />}
    >
      <IntegrationGrid>
        {integrations.map(integration => (
          <PermissionGuard key={integration.id} permission="integrations:write">
            <IntegrationCard 
              integration={integration}
              showEdit={true}
              showDelete={true}
            />
          </PermissionGuard>
        ))}
      </IntegrationGrid>
    </PermissionGuard>
  );
}
```

---

### Analytics Feature

**File**: `src/pages/Analytics/`

```typescript
export function Analytics() {
  // All authenticated users can read analytics
  return (
    <PermissionGuard permission="analytics:read">
      <AnalyticsContent />
    </PermissionGuard>
  );
}
```

---

### Billing Feature

**File**: `src/pages/Billing/`

```typescript
export function BillingPage() {
  return (
    <>
      {/* All members can view billing status */}
      <PermissionGuard permission="billing:read">
        <BillingStatus />
      </PermissionGuard>

      {/* Only owners can manage billing */}
      <PermissionGuard 
        permission="billing:manage"
        fallback={<p>Contact your organization owner to manage billing</p>}
      >
        <BillingManagement />
      </PermissionGuard>
    </>
  );
}
```

---

### Company Settings Feature

**File**: `src/pages/Settings/`

```typescript
export function CompanySettings() {
  return (
    <>
      <PermissionGuard permission="company:read">
        <CompanyInfo />
      </PermissionGuard>

      <PermissionGuard 
        permission="company:update"
        fallback={<PermissionDenied message="Only admins can update company settings" />}
      >
        <CompanyForm />
      </PermissionGuard>

      <PermissionGuard permission="company:delete">
        <DangerZone>
          <button>Delete Company</button>
        </DangerZone>
      </PermissionGuard>
    </>
  );
}
```

---

### Webhooks Feature

**File**: `src/pages/Webhooks/`

```typescript
export function WebhooksPage() {
  return (
    <PermissionGuard 
      permission="webhooks:write"
      fallback={<PermissionDenied message="Only admins can configure webhooks" />}
    >
      <WebhookConfiguration />
      <WebhookLogs />
    </PermissionGuard>
  );
}
```

---

## Advanced Patterns

### Pattern 1: Role-Based UI Variations

```typescript
export function SubmissionPanel() {
  const { userRole } = usePermissions();

  switch (userRole) {
    case 'owner':
    case 'admin':
      return <AdminSubmissionPanel />;
    case 'manager':
      return <ManagerSubmissionPanel />;
    case 'viewer':
      return <ViewerSubmissionPanel />;
    default:
      return <PermissionDenied />;
  }
}
```

### Pattern 2: Progressive Disclosure

```typescript
export function SubmissionCard({ submission }) {
  return (
    <Card>
      {/* Everyone sees this */}
      <h3>{submission.subject}</h3>

      {/* Only readers and above */}
      <PermissionGuard permission="submissions:read">
        <p>{submission.description}</p>
      </PermissionGuard>

      {/* Only managers and above */}
      <PermissionGuard permission="submissions:assign">
        <AssignmentDropdown submission={submission} />
      </PermissionGuard>

      {/* Only admins+ */}
      <PermissionGuard permission="submissions:delete">
        <DeleteButton submission={submission} />
      </PermissionGuard>
    </Card>
  );
}
```

### Pattern 3: Conditional API Calls

```typescript
export function DataManager() {
  const { hasPermissionTo } = usePermissions();

  async function handleSubmit(data) {
    if (!hasPermissionTo('submissions:write')) {
      throw new Error('Permission denied');
    }

    // Safe to make API call
    const response = await api.updateSubmission(data);
    return response;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
}
```

### Pattern 4: Error Boundaries with Permissions

```typescript
export function ProtectedFeature() {
  const { hasPermissionTo } = usePermissions();

  if (!hasPermissionTo('feature:access')) {
    return (
      <ErrorBoundary>
        <PermissionDenied message="Feature not available for your role" />
      </ErrorBoundary>
    );
  }

  return <Feature />;
}
```

---

## API Integration Pattern

### Making Authenticated Requests

```typescript
// In src/lib/firestore.ts or similar
import { auth } from './firebase';

export async function updateMemberRole(userId: string, newRole: UserRole) {
  const token = await auth.currentUser?.getIdToken();
  
  const response = await fetch(
    `/api/team/${companyId}/members/${userId}/role`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newRole })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update role');
  }

  return response.json();
}
```

### Handling Permission Errors from API

```typescript
export function useTeamActions() {
  const [error, setError] = useState('');

  async function changeRole(userId: string, newRole: UserRole) {
    try {
      await updateMemberRole(userId, newRole);
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('You do not have permission to change this role');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update role');
      }
    }
  }

  return { changeRole, error };
}
```

---

## Testing RBAC Integration

### Unit Test Example

```typescript
// __tests__/PermissionGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '../PermissionGuard';

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissionTo: (perm: string) => perm === 'allowed'
  })
}));

test('shows children when permission granted', () => {
  render(
    <PermissionGuard permission="allowed">
      <div>Content</div>
    </PermissionGuard>
  );
  
  expect(screen.getByText('Content')).toBeInTheDocument();
});

test('shows fallback when permission denied', () => {
  render(
    <PermissionGuard 
      permission="denied"
      fallback={<div>Access Denied</div>}
    >
      <div>Content</div>
    </PermissionGuard>
  );
  
  expect(screen.getByText('Access Denied')).toBeInTheDocument();
  expect(screen.queryByText('Content')).not.toBeInTheDocument();
});
```

### Integration Test Example

```typescript
// __tests__/TeamManagement.integration.test.tsx
test('Admin can change Manager role but not Admin role', async () => {
  const adminUser = { role: 'admin' as UserRole };
  
  render(<TeamManagement user={adminUser} />);
  
  // Click edit for Manager
  const editButton = screen.getByLabelText('Edit manager@example.com');
  fireEvent.click(editButton);
  
  // Modal should be open
  expect(screen.getByText('Change Member Role')).toBeInTheDocument();
  
  // Can select Viewer
  const viewerOption = screen.getByLabelText('Viewer');
  fireEvent.click(viewerOption);
  
  // Can confirm
  const confirmButton = screen.getByText('Update Role');
  expect(confirmButton).not.toBeDisabled();
});
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Only Frontend Protection
```typescript
// BAD: Only hiding UI, not protecting API
<PermissionGuard permission="team:manage">
  <DeleteButton onClick={() => deleteTeamMember(userId)} />
</PermissionGuard>
```

### ✅ Correct: Frontend + Backend Protection
```typescript
// GOOD: Frontend + backend validation
const { hasPermissionTo } = usePermissions();

async function handleDelete() {
  if (!hasPermissionTo('team:remove')) {
    return; // Frontend check
  }
  
  try {
    await deleteTeamMember(userId); // API validates again
  } catch (error) {
    if (error.status === 403) {
      // Handle permission error
    }
  }
}
```

### ❌ Mistake 2: Trusting Client Role
```typescript
// BAD: Reading role from localStorage
const role = localStorage.getItem('userRole');
if (role === 'admin') { /* allow action */ }
```

### ✅ Correct: Using Hook and Verified Token
```typescript
// GOOD: Getting role from context (verified by backend)
const { userRole } = usePermissions();
if (userRole === 'admin') { /* allow action */ }
```

### ❌ Mistake 3: No Fallback UI
```typescript
// BAD: Component disappears without explanation
<PermissionGuard permission="restricted">
  <RestrictedFeature />
</PermissionGuard>
```

### ✅ Correct: Meaningful Fallback
```typescript
// GOOD: User understands why they can't see content
<PermissionGuard 
  permission="restricted"
  fallback={<PermissionDenied message="Contact admin to enable this feature" />}
>
  <RestrictedFeature />
</PermissionGuard>
```

---

## Monitoring & Logging

### Check Audit Logs in Cloud Firestore

```typescript
// View role changes
firebase firestore:query "companies/{companyId}/audit_logs" \
  --where action == role_changed
```

### Monitor Permission Errors

```typescript
// In Cloud Functions logging
console.error('Permission denied:', {
  user: req.user?.uid,
  requiredPermission: 'team:manage',
  userRole: req.user?.role
});
```

---

## Deployment Checklist

- [ ] All components use PermissionGuard for sensitive features
- [ ] Fallback UI provided for denied permissions
- [ ] API endpoints validate permissions with RBAC middleware
- [ ] Firestore rules enforce role-based access
- [ ] Tests cover all four roles
- [ ] Audit logs enabled and working
- [ ] Error messages user-friendly
- [ ] Mobile layout tested with role indicators
- [ ] Accessibility: Role labels have proper ARIA
- [ ] Performance: No N+1 permission checks
- [ ] Security review of all permission checks

---

## Migration Path for Existing Code

### Step 1: Identify Unprotected Features
Search for buttons/forms without permission checks:
```bash
grep -r "onClick.*Delete\|onClick.*Remove\|onClick.*Update" src/
```

### Step 2: Add PermissionGuard
```typescript
// Before
<button onClick={deleteItem}>Delete</button>

// After
<PermissionGuard permission="items:delete">
  <button onClick={deleteItem}>Delete</button>
</PermissionGuard>
```

### Step 3: Add API Validation
Update Cloud Functions to use RBAC middleware

### Step 4: Test Each Role
Login as each role and verify UI/API behavior

### Step 5: Document Changes
Add comment linking to RBAC system documentation
