# Custom Form Builder

A comprehensive form builder component for FeedSolve boards with drag-and-drop support, conditional logic, templates, and tier-based limits.

## Components

### FormBuilder
The main form builder interface with drag-and-drop field reordering.

**Props:**
- `initialForm?: CustomForm` - Existing form to edit
- `onSave: (form: CustomForm) => Promise<void>` - Save callback
- `onCancel: () => void` - Cancel callback
- `maxFields: number` - Maximum fields allowed by tier

**Features:**
- Add, edit, duplicate, and delete fields
- Drag-and-drop to reorder fields
- Live preview of the form
- Field count tracking
- Form validation

### FieldPalette
Shows available field types that can be added to the form.

**Field Types:**
- `text` - Short text input
- `longtext` - Long text area
- `email` - Email input with validation
- `select` - Dropdown selector
- `checkbox` - Multiple choice checkboxes
- `radio` - Single choice radio buttons
- `date` - Date picker
- `file` - File upload
- `rating` - 1-5 star rating

### FieldEditor
Edit properties of individual form fields.

**Supported Properties:**
- Label (required, max 50 chars)
- Placeholder text
- Help text
- Options (for select/radio/checkbox)
- Required toggle
- Conditional logic rules

### ConditionalLogicBuilder
Set up conditional display rules for fields.

**Operators:**
- `equals` - Field value equals comparison value
- `notEquals` - Field value does not equal comparison value
- `contains` - Field value contains comparison value

**Example:** Show email field only if user type is "customer"

### FormPreview
Live preview showing how the form will appear to users with full interactivity.

**Features:**
- Interactive form experience
- Real-time validation
- Conditional field visibility
- Different input types for each field

### FormTemplateManager
Create, browse, and apply form templates for quick setup.

**Features:**
- Save current form as a template
- Browse available templates
- Apply templates to boards
- Usage tracking
- Delete templates (creator only)

### BoardFormSettings
Wrapper component for managing form settings on a board.

**Shows:**
- Current form status
- Tier limits and features
- Field configuration
- Action buttons

## Usage

### Basic Usage

```tsx
import { FormBuilder } from './components/FormBuilder';
import { useFormBuilder } from './hooks/useFormBuilder';

function BoardEditForm({ boardId, companyId }) {
  const { form, saveForm } = useFormBuilder({ boardId, companyId });
  
  return (
    <FormBuilder
      initialForm={form}
      onSave={saveForm}
      onCancel={() => {}}
      maxFields={10}
    />
  );
}
```

### With Template Manager

```tsx
import { BoardFormSettings } from './components/FormBuilder';

function BoardSettings({ boardId, companyId, subscription, userId }) {
  return (
    <BoardFormSettings
      boardId={boardId}
      companyId={companyId}
      subscription={subscription}
      userId={userId}
      onClose={() => {}}
    />
  );
}
```

## Type Definitions

### FormField
```typescript
interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  conditionalLogic?: ConditionalLogicRule;
  order: number;
}
```

### CustomForm
```typescript
interface CustomForm {
  enabled: boolean;
  fields: FormField[];
  steps?: FormStep[];
  template?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### FormTemplate
```typescript
interface FormTemplate {
  id: string;
  companyId: string;
  name: string;
  description: string;
  form: CustomForm;
  usageCount: number;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  isPublic: boolean;
}
```

## Tier Limits

### Free
- Max 5 fields
- No templates
- No conditional logic
- No multi-step forms
- Basic validation only

### Starter
- Max 10 fields
- Up to 3 templates
- Conditional logic enabled
- No multi-step forms
- Basic validation

### Growth
- Max 20 fields
- Up to 10 templates
- Conditional logic enabled
- Multi-step forms enabled
- Advanced validation enabled

### Business
- Unlimited fields
- Unlimited templates
- All features enabled

## Database Schema

### Board Document
```
/companies/{companyId}/boards/{boardId}
{
  ...existing fields
  customForm: {
    enabled: boolean
    fields: FormField[]
    steps?: FormStep[]
    template?: string
    createdAt: Timestamp
    updatedAt: Timestamp
  }
}
```

### Form Templates Collection
```
/companies/{companyId}/formTemplates/{templateId}
{
  id: string
  companyId: string
  name: string
  description: string
  form: CustomForm
  usageCount: number
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  isPublic: boolean
}
```

### Submission Document
```
/companies/{companyId}/submissions/{submissionId}
{
  ...existing fields
  formData: {
    [fieldId]: string | string[] | number | boolean | null
  }
}
```

## Utilities

### form-validation.ts
- `validateFormSchema(fields)` - Validate form structure
- `validateSubmission(data, fields)` - Validate form submission
- `evaluateConditionalLogic(rule, formData)` - Evaluate show/hide rules
- `isValidEmail(email)` - Email validation
- `isValidDate(date)` - Date validation

### form-storage.ts
- `saveFormToBoard()` - Save form to board
- `getFormFromBoard()` - Load form from board
- `saveFormTemplate()` - Save as template
- `getFormTemplate()` - Load template
- `listFormTemplates()` - List all templates
- `deleteFormTemplate()` - Delete template

### form-tier-limits.ts
- `getFormTierLimits(subscription)` - Get tier limits
- `canAddMoreFields()` - Check field limit
- `canCreateTemplate()` - Check template limit

## Hook: useFormBuilder

```typescript
const {
  form,
  templates,
  loading,
  error,
  loadForm,
  saveForm,
  loadTemplates,
  createTemplate,
  applyTemplate,
  removeTemplate,
} = useFormBuilder({ boardId, companyId });
```

## Styling

All components use CSS modules with consistent styling:
- Form builder: `FormBuilder.css`
- Template manager: `FormTemplateManager.css`
- Settings panel: `BoardFormSettings.css`

Responsive design supports mobile, tablet, and desktop views.

## Examples

### Creating a Form from Scratch
1. Click "Create Custom Form"
2. Add fields using the Field Palette
3. Edit each field's properties
4. Set conditional logic rules (if available)
5. Preview the form
6. Save

### Using a Template
1. Click "Use Template"
2. Browse available templates
3. Click "Use Template" on desired template
4. Modify fields as needed
5. Save

### Saving a Template
1. Configure your form
2. In template manager: "Create New Template"
3. Enter template name and description
4. Click "Create Template"

## Future Enhancements

- Multi-step forms with progress indicator
- File upload storage integration
- Advanced field validation rules
- Email notifications on form submissions
- Analytics on form submissions
- A/B testing for form fields
- Form branching/conditional steps
- Required field percentage tracking
