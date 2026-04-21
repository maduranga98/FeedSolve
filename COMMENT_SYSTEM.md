# Team Collaboration Comments System Documentation

## Overview

The Comments System enables team members to collaborate on submissions through internal comments with @mentions, reactions, and real-time updates.

## Architecture

### Database Schema

```
submissions/{submissionId}/
  comments/{commentId}
    - content: string
    - author: { id, name, email, avatar? }
    - mentions: string[] (user IDs)
    - reactions: { emoji: string, userIds: string[] }[]
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - isEdited: boolean
    - parentCommentId?: string (for replies)

companies/{companyId}/
  notifications/{notificationId}
    - userId: string
    - mentionedBy: string
    - submissionId: string
    - commentId: string
    - isRead: boolean
    - createdAt: Timestamp
    - type: 'mention'
```

### Security Rules

- Only team members can read comments on submissions
- Only comment authors can edit/delete their own comments
- @mentions validate that mentioned users exist in the company
- Notifications are read-only by the recipient user
- Maximum 15 mentions per comment

## React Components

### CommentThread
Main component that manages all comments for a submission.

```tsx
<CommentThread
  submissionId={submissionId}
  companyId={companyId}
  currentUser={user}
  teamMembers={teamMembers}
  onCommentAdded={(count) => console.log(count)}
/>
```

**Features:**
- Real-time comment updates via Firebase listeners
- Comment count display
- Threading/replies support
- Auto-scroll to latest
- "No comments" state

### CommentInput
Rich text editor with @mention autocomplete.

```tsx
<CommentInput
  onSubmit={(content, mentions) => handleSubmit(content, mentions)}
  teamMembers={teamMembers}
  placeholder="Add a comment..."
  isLoading={false}
  showCancel={true}
  isReply={false}
/>
```

**Features:**
- @mention autocomplete with filtering
- Formatting hints (bold, code, mentions)
- Real-time mention detection
- Submit/Cancel buttons
- Disabled state during submission

### CommentCard
Individual comment display with actions.

```tsx
<CommentCard
  comment={comment}
  currentUserId={userId}
  onDelete={handleDelete}
  onEdit={handleEdit}
  onReply={handleReply}
  onAddReaction={handleAddReaction}
  onRemoveReaction={handleRemoveReaction}
  replies={replies}
  isReply={false}
/>
```

**Features:**
- Edit/Delete for authors only
- Emoji reactions with counts
- Timestamps with "edited" indicator
- Reply button for threading
- Nested reply display
- User avatars
- Soft deletes (shows "[deleted]")

### MentionDropdown
Autocomplete dropdown for @mentions.

```tsx
<MentionDropdown
  searchTerm="jo"
  teamMembers={teamMembers}
  onSelectMention={(member) => handleMention(member)}
  isOpen={true}
  onClose={() => setOpen(false)}
/>
```

**Features:**
- Filters by name/email
- Shows user names and emails
- Clicks outside to close
- Keyboard navigation support

### ReactionPicker
Emoji reaction selector.

```tsx
<ReactionPicker
  onSelectEmoji={(emoji) => handleReaction(emoji)}
  isOpen={true}
  onClose={() => setOpen(false)}
/>
```

**Features:**
- 14 common emojis
- Grid layout
- Clicks outside to close
- Smooth animations

## Firestore Functions

Located in `src/lib/firestore.ts`:

### Comments
```typescript
// Create a new comment
addComment(
  submissionId: string,
  companyId: string,
  content: string,
  author: { id, name, email, avatar? },
  mentions: string[],
  parentCommentId?: string
): Promise<string>

// Get all comments for a submission
getComments(submissionId: string): Promise<Comment[]>

// Update comment content
updateComment(submissionId: string, commentId: string, content: string): Promise<void>

// Soft delete a comment
deleteComment(submissionId: string, commentId: string): Promise<void>

// Get comment count
getCommentCount(submissionId: string): Promise<number>
```

### Reactions
```typescript
// Add emoji reaction
addReaction(
  submissionId: string,
  commentId: string,
  emoji: string,
  userId: string
): Promise<void>

// Remove emoji reaction
removeReaction(
  submissionId: string,
  commentId: string,
  emoji: string,
  userId: string
): Promise<void>
```

### Notifications
```typescript
// Create mention notification
createCommentNotification(
  companyId: string,
  userId: string,
  mentionedBy: string,
  submissionId: string,
  commentId: string
): Promise<string>
```

## Cloud Functions

Located in `functions/src/comment-notifications.ts`:

### onCommentCreated
Triggers when a comment is created:
- Creates notifications for mentioned users
- Updates submission comment count
- Logs audit events

### onCommentUpdated
Triggers when a comment is edited/reacted:
- Tracks reaction changes
- Logs edit events to audit log

### onCommentDeleted
Triggers when a comment is deleted:
- Updates submission comment count
- Logs deletion to audit log

### clearOldNotifications
Scheduled function (weekly):
- Removes notifications older than 30 days
- Reduces database size

## Custom Hooks

### useComments
Real-time comment loading and listening.

```typescript
const { comments, isLoading, error, commentCount } = useComments(submissionId);
```

### useCommentNotifications
Real-time notification updates for current user.

```typescript
const { notifications, unreadCount, isLoading } = useCommentNotifications(
  companyId,
  userId
);
```

## Integration Example

```tsx
import { CommentThread } from '@/components/Comments';
import { useComments } from '@/hooks/useComments';
import { useCommentNotifications } from '@/hooks/useCommentNotifications';

function SubmissionDetail({ submissionId, currentUser, teamMembers }) {
  const { comments, commentCount } = useComments(submissionId);
  const { unreadCount } = useCommentNotifications(
    currentUser.companyId,
    currentUser.id
  );

  return (
    <div>
      <h2>Submission Details</h2>
      
      <div className="flex items-center gap-2">
        <span>Comments</span>
        <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-sm">
          {commentCount}
        </span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white rounded-full px-2 py-0.5 text-sm">
            {unreadCount} unread
          </span>
        )}
      </div>

      <CommentThread
        submissionId={submissionId}
        companyId={currentUser.companyId}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onCommentAdded={(count) => {
          console.log(`Total comments: ${count}`);
        }}
      />
    </div>
  );
}
```

## Features Implemented

### Core Features
✅ Add comments/notes to submissions (internal only)
✅ @mention team members with autocomplete
✅ Comment threads/replies
✅ Edit/delete own comments
✅ Real-time updates via Firebase listeners

### Formatting & Reactions
✅ Rich text formatting hints (bold, code blocks)
✅ Emoji reactions with user counts
✅ Reaction picker with common emojis

### Notifications & Mentions
✅ Notification creation on @mentions
✅ Real-time notification updates
✅ Notification badge with unread count
✅ Auto-cleanup of old notifications (30+ days)

### UI/UX
✅ Comment count in submission details
✅ Unread comment indicator
✅ Auto-scroll to latest comment
✅ "Someone is typing..." (ready for implementation)
✅ Edited indicator with timestamp

### Security & Validation
✅ Team members only access
✅ Author-only edit/delete
✅ Mention validation (must be team members)
✅ Role-based Firestore rules
✅ Maximum 15 mentions per comment

### Cloud Functions
✅ Automatic notification creation
✅ Comment count synchronization
✅ Audit logging for edits/deletes
✅ Scheduled cleanup of old notifications

## TypeScript Support

All components and hooks are fully typed with TypeScript. Key types:

```typescript
interface Comment {
  id: string;
  submissionId: string;
  companyId: string;
  content: string;
  author: CommentAuthor;
  mentions: string[];
  reactions: Reaction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  parentCommentId?: string;
}

interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Reaction {
  emoji: string;
  userIds: string[];
}

interface CommentNotification {
  id: string;
  companyId: string;
  userId: string;
  mentionedBy: string;
  submissionId: string;
  commentId: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

## Performance Considerations

1. **Real-time Updates**: Comments use Firestore listeners for instant updates across users
2. **Pagination**: For submissions with 100+ comments, consider implementing pagination
3. **Lazy Loading**: Replies can be loaded on-demand by expanding a "View replies" section
4. **Batch Operations**: Mention notifications are created in batches for efficiency
5. **Index Requirements**: Firestore indexes for:
   - `notifications.userId + createdAt` (read-only users' recent mentions)
   - `comments.createdAt` (sorting comments chronologically)

## Future Enhancements

1. Rich text editor (Slate.js integration)
2. File attachments in comments
3. Comment mentions in submission notifications
4. Thread unread state tracking
5. Comment mentions in activity logs
6. Typing indicators
7. Comment moderation/flagging
8. Email digests of mentions
9. Slack integration for mentions
10. Comment search across submissions

## Testing

Example test cases to implement:

```typescript
describe('CommentThread', () => {
  it('should display comments in chronological order');
  it('should allow authors to edit their comments');
  it('should create notifications for @mentions');
  it('should filter mentions by team members only');
  it('should show reaction counts correctly');
  it('should handle deletion gracefully');
  it('should display replies nested correctly');
});
```

## Troubleshooting

### Comments not loading
- Check Firestore security rules
- Verify submission ID is correct
- Check Firebase initialization

### Mentions not working
- Verify team members are in the same company
- Check mention validation in Firestore rules
- Ensure user IDs match exactly

### Notifications not appearing
- Check Cloud Functions deployment
- Verify `onCommentCreated` trigger is active
- Check notification collection permissions

### Real-time updates not working
- Verify Firebase listener is subscribed
- Check network connection
- Verify Firestore connection status
