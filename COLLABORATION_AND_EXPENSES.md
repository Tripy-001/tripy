# Collaboration and Expense Splitting Feature

## Overview

This document describes the implementation of collaboration and expense splitting features for the Tripy application. These features allow users to invite friends to trips, collaborate on trip planning, and track/split expenses between group members.

## Features Implemented

### 1. Trip Collaboration
- **Invite Collaborators**: Trip owners can invite users by email to collaborate on trips
- **Invitation System**: Secure invitation tokens sent via email for both existing and new users
- **New User Support**: Users without accounts receive invitation emails and can sign up to join trips
- **Multiple Collaborators**: Support for multiple collaborators per trip
- **Access Control**: Collaborators can view and edit trips (but cannot delete or modify collaborators list)
- **Dashboard Integration**: Collaborators can see shared trips in their dashboard

### 2. Expense Management
- **Add Expenses**: Record expenses with description, amount, currency, category, and date
- **Split Expenses**: Split expenses between selected trip members
- **Expense Categories**: Accommodation, Food & Dining, Transportation, Activities, Shopping, Other
- **Multi-Currency Support**: Support for multiple currencies (INR, USD, EUR, GBP, JPY, AUD, CAD)
- **Expense Summary**: Automatic calculation of who paid what and who owes whom
- **Settlement Calculations**: Shows simplified settlement transactions between members

## Backend Changes

### New API Endpoints

#### Collaborator Management

**GET `/api/trips/[tripId]/collaborators`**
- Returns list of all collaborators and owner for a trip
- Includes user details (name, email, isOwner flag)
- Requires authentication and trip access

**POST `/api/trips/[tripId]/collaborators`**
- Adds a collaborator directly by userId (bypasses invitation)
- Only accepts `userId` in request body
- Only trip owner can add collaborators
- For email invitations, use `/api/trips/[tripId]/invitations` instead

**DELETE `/api/trips/[tripId]/collaborators/[userId]`**
- Removes a collaborator from a trip
- Owner can remove any collaborator
- Collaborators can remove themselves
- Updates trip document with new collaborators array

#### Invitation Management

**GET `/api/trips/[tripId]/invitations`**
- Returns list of pending invitations for a trip
- Only trip owner can view invitations
- Shows invitation email, status, and expiration date

**POST `/api/trips/[tripId]/invitations`**
- Creates an invitation for a collaborator
- Accepts `email` in request body
- Generates secure invitation token
- Sends invitation email to user
- If user exists, adds them directly and sends notification
- If user doesn't exist, creates pending invitation
- Invitations expire after 7 days

**GET `/api/invitations/accept`**
- Gets invitation details by token
- Used by frontend to display invitation information
- Validates token and checks expiration

**POST `/api/invitations/accept`**
- Accepts an invitation
- Requires `token`, `tripId`, and optionally `userId`
- If userId provided, adds user as collaborator
- If no userId, returns invitation details for signup flow
- Marks invitation as accepted

#### Expense Management

**GET `/api/trips/[tripId]/expenses`**
- Returns all expenses for a trip
- Ordered by date (newest first)
- Includes all expense details

**POST `/api/trips/[tripId]/expenses`**
- Creates a new expense
- Required fields: `description`, `amount`, `paidBy`, `splitBetween`
- Optional fields: `currency`, `category`, `date`
- Validates that `paidBy` and all `splitBetween` users are trip members

**PUT `/api/trips/[tripId]/expenses/[expenseId]`**
- Updates an existing expense
- Same validation as POST
- Prevents modification of creation timestamp

**DELETE `/api/trips/[tripId]/expenses/[expenseId]`**
- Deletes an expense
- Requires trip access (owner or collaborator)

**GET `/api/trips/[tripId]/expenses/summary`**
- Returns expense summary and settlement calculations
- Shows:
  - Total expenses per currency
  - What each user paid and owes
  - Net amounts (paid - owes)
  - Simplified settlement transactions (who owes whom)

### Updated API Endpoints

#### GET `/api/trips`
- **Before**: Only returned trips owned by the user
- **After**: Returns trips owned by user AND trips where user is a collaborator
- Adds `isOwner` flag to each trip (true for owned trips, false for collaborated trips)
- Uses two queries:
  - `where('userId', '==', userId)` for owned trips
  - `where('collaborators', 'array-contains', userId)` for collaborated trips
- Combines and deduplicates results

#### GET/PUT/DELETE `/api/trips/[tripId]`
- **Before**: Only owner could access trips
- **After**: Both owner and collaborators can access trips
- Uses `checkTripAccess()` helper function
- DELETE still restricted to owner only

### Database Schema Changes

#### Trip Document
```typescript
{
  userId: string;              // Owner's user ID
  collaborators: string[];     // Array of collaborator user IDs (NEW)
  // ... other trip fields
}
```

#### Invitation Subcollection (`trips/{tripId}/invitations/{invitationId}`)
```typescript
{
  email: string;               // Invited user's email
  token: string;                // Secure invitation token
  invitedBy: string;            // User ID who sent invitation
  status: 'pending' | 'accepted' | 'expired';
  existingUserId: string | null; // User ID if user exists, null if new user
  createdAt: Timestamp;
  expiresAt: Timestamp;         // 7 days from creation
  acceptedAt?: Timestamp;
  acceptedBy?: string;
}
```

#### Expense Subcollection (`trips/{tripId}/expenses/{expenseId}`)
```typescript
{
  description: string;         // Expense description
  amount: number;              // Expense amount
  currency: string;           // Currency code (default: 'INR')
  paidBy: string;             // User ID who paid
  splitBetween: string[];      // Array of user IDs to split between
  date: Timestamp;            // Expense date
  category: string;           // Expense category
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Helper Functions

#### `lib/tripAccess.ts`
New utility module for checking trip access permissions:

```typescript
checkTripAccess(tripId: string, userId: string): Promise<TripAccessResult>
```

Returns:
- `hasAccess`: boolean - Whether user has access
- `isOwner`: boolean - Whether user is the owner
- `isCollaborator`: boolean - Whether user is a collaborator
- `tripData`: Trip data object

## Frontend Changes

### New Components

#### `components/CollaboratorsList.tsx`
- Displays list of trip collaborators and owner
- Shows user avatars, names, and emails
- "Invite" button for owners to add collaborators
- Remove collaborator functionality (owner only)
- Real-time updates when collaborators are added/removed

**Props:**
- `tripId: string` - Trip ID
- `isOwner: boolean` - Whether current user is owner

#### `components/ExpenseManager.tsx`
- Full expense management interface
- Add/edit/delete expenses
- Expense list with details
- Expense summary with settlement calculations
- Split selection with checkboxes
- Category and currency selection

**Props:**
- `tripId: string` - Trip ID
- `tripMembers: Array<{id, name, email, isOwner}>` - List of trip members

### Updated Components

#### `app/trip/[id]/page.tsx`
- Added CollaboratorsList component
- Added ExpenseManager component
- Added sections to navigation tabs
- Fetches trip members for expense management
- Tracks user's owner status

**New State:**
- `tripMembers`: Array of trip members (owner + collaborators)
- `isOwner`: Boolean indicating if current user is owner

**New Function:**
- `fetchTripMembers()`: Fetches collaborators and builds members list

#### `app/dashboard/page.tsx`
- Shows "Shared" badge on collaborated trips
- Displays both owned and collaborated trips
- Visual distinction between owned and shared trips

#### `lib/store.ts`
- Updated `Trip` interface to include `isOwner?: boolean`
- Updated `fetchUserTrips()` to preserve `isOwner` flag from API

## Usage Guide

### For Trip Owners

#### Inviting Collaborators
1. Navigate to a trip page
2. Scroll to the "Collaborators" section
3. Click "Invite" button
4. Enter collaborator's email address
5. Click "Invite" to send invitation
6. System will:
   - If user exists: Add them immediately and send notification email
   - If user doesn't exist: Create invitation token and send invitation email
7. Invited user receives email with invitation link
8. User clicks link and:
   - If signed in: Can accept invitation immediately
   - If not signed in: Redirected to sign up/sign in page
9. After signup/signin, invitation is automatically accepted and user is redirected to trip

#### Managing Expenses
1. Navigate to trip page
2. Scroll to "Expenses" section
3. Click "Add Expense"
4. Fill in expense details:
   - Description (required)
   - Amount (required)
   - Currency (default: INR)
   - Paid By (required)
   - Category
   - Date
   - Split Between (select members, required)
5. Click "Add Expense"

#### Viewing Expense Summary
- Expense summary automatically calculates:
  - Total expenses per currency
  - What each member paid
  - What each member owes
  - Net amounts
  - Settlement transactions (who should pay whom)

### For Collaborators

#### Accessing Shared Trips
- Shared trips appear in dashboard with "Shared" badge
- Click on trip card to view trip details
- Full access to view and edit trip
- Can add/edit/delete expenses
- Cannot remove other collaborators or delete trip

#### Adding Expenses
- Same process as owners
- Can record expenses they paid
- Can split expenses between any trip members

## Technical Details

### Authorization Flow

1. **Trip Access Check**: All trip-related endpoints use `checkTripAccess()` helper
2. **Owner Permissions**: Only owners can:
   - Delete trips
   - Add/remove collaborators
   - Modify collaborators array
3. **Collaborator Permissions**: Collaborators can:
   - View trip
   - Edit trip details
   - Manage expenses
   - View collaborators list

### Expense Splitting Algorithm

1. **Per-Expense Split**: Each expense is split equally among selected members
   - Split amount = `expense.amount / splitBetween.length`
2. **Totals Calculation**:
   - `paid`: Sum of all expenses where user is `paidBy`
   - `owes`: Sum of all split amounts where user is in `splitBetween`
   - `net`: `paid - owes` (positive = creditor, negative = debtor)
3. **Settlement Calculation**:
   - Groups users into creditors (net > 0) and debtors (net < 0)
   - Uses greedy algorithm to match creditors with debtors
   - Only settles within same currency
   - Shows minimum number of transactions needed

### Firestore Queries

#### Collaborators Query
```typescript
where('collaborators', 'array-contains', userId)
```
- No composite index required (single field query)
- Efficient for finding trips where user is collaborator

#### Expenses Query
```typescript
orderBy('date', 'desc')
```
- Orders expenses by date (newest first)
- Requires index on `date` field

## Migration Notes

### Existing Trips
- Existing trips without `collaborators` field will work correctly
- API defaults to empty array `[]` if field is missing
- No migration script needed (handled in code)

### Backward Compatibility
- All changes are backward compatible
- `isOwner` defaults to `true` if not present
- `collaborators` defaults to empty array if not present

## Future Enhancements

Potential improvements for future versions:

1. **Notifications**: Notify users when invited to trips or when expenses are added
2. **Expense Receipts**: Upload and attach receipts to expenses
3. **Advanced Splitting**: Support for unequal splits (e.g., 60/40)
4. **Currency Conversion**: Automatic currency conversion for multi-currency trips
5. **Expense Reports**: Generate PDF reports of expenses
6. **Payment Tracking**: Mark expenses as settled/paid
7. **Recurring Expenses**: Support for recurring expenses (daily meals, etc.)
8. **Expense Templates**: Save common expense patterns
9. **Group Chat**: In-trip messaging for collaborators
10. **Activity Log**: Track who made what changes to the trip

## Testing Checklist

- [ ] Owner can invite collaborator by email
- [ ] Collaborator receives access to trip
- [ ] Collaborator sees trip in dashboard
- [ ] Collaborator can view trip details
- [ ] Collaborator can edit trip
- [ ] Collaborator cannot delete trip
- [ ] Collaborator cannot modify collaborators list
- [ ] Owner can remove collaborators
- [ ] Collaborator can remove themselves
- [ ] Expense can be added with all fields
- [ ] Expense can be split between multiple members
- [ ] Expense summary calculates correctly
- [ ] Settlement transactions are accurate
- [ ] Multi-currency expenses work correctly
- [ ] Expense can be edited
- [ ] Expense can be deleted
- [ ] Dashboard shows both owned and collaborated trips
- [ ] "Shared" badge appears on collaborated trips

## Files Changed

### Backend
- `app/api/trips/route.ts` - Updated to include collaborated trips
- `app/api/trips/[tripId]/route.ts` - Updated access control
- `app/api/trips/[tripId]/collaborators/route.ts` - Updated: Direct collaborator add (by userId)
- `app/api/trips/[tripId]/collaborators/[userId]/route.ts` - NEW: Remove collaborator
- `app/api/trips/[tripId]/invitations/route.ts` - NEW: Invitation management
- `app/api/invitations/accept/route.ts` - NEW: Accept invitations
- `app/api/trips/[tripId]/expenses/route.ts` - NEW: Expense CRUD
- `app/api/trips/[tripId]/expenses/[expenseId]/route.ts` - NEW: Update/delete expense
- `app/api/trips/[tripId]/expenses/summary/route.ts` - NEW: Expense summary
- `app/api/trips/generate/route.ts` - Initialize collaborators array
- `lib/tripAccess.ts` - NEW: Access control helper
- `lib/emailService.ts` - NEW: Email service (placeholder for email sending)

### Frontend
- `components/CollaboratorsList.tsx` - NEW: Collaborator management UI (updated to use invitations)
- `components/ExpenseManager.tsx` - NEW: Expense management UI
- `app/trip/[id]/page.tsx` - Added collaboration and expense sections
- `app/dashboard/page.tsx` - Show collaborated trips with badge
- `app/invitations/accept/page.tsx` - NEW: Invitation acceptance page
- `app/signup/page.tsx` - Updated: Handle invitation tokens
- `app/signin/page.tsx` - Updated: Handle invitation tokens
- `lib/store.ts` - Updated Trip interface and fetch logic

### Configuration
- `firestore.indexes.json` - Added indexes for invitations queries

## API Examples

### Invite Collaborator
```bash
POST /api/trips/{tripId}/collaborators
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "collaborator@example.com"
}
```

### Add Expense
```bash
POST /api/trips/{tripId}/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Hotel booking",
  "amount": 5000,
  "currency": "INR",
  "paidBy": "user123",
  "splitBetween": ["user123", "user456", "user789"],
  "date": "2024-01-15",
  "category": "accommodation"
}
```

### Get Expense Summary
```bash
GET /api/trips/{tripId}/expenses/summary
Authorization: Bearer {token}
```

Response:
```json
{
  "summary": {
    "totalExpenses": {
      "INR": 15000
    },
    "userTotals": [
      {
        "userId": "user123",
        "paid": 10000,
        "owes": 5000,
        "net": 5000,
        "currency": "INR"
      },
      {
        "userId": "user456",
        "paid": 0,
        "owes": 5000,
        "net": -5000,
        "currency": "INR"
      }
    ],
    "settlements": [
      {
        "from": "user456",
        "to": "user123",
        "amount": 5000,
        "currency": "INR"
      }
    ]
  }
}
```

## Email Service Setup

The invitation system includes an email service placeholder (`lib/emailService.ts`). To enable actual email sending, you need to integrate an email service provider.

### Recommended Options:

1. **Resend** (Recommended for Next.js)
   ```bash
   npm install resend
   ```
   Set `RESEND_API_KEY` environment variable
   Update `lib/emailService.ts` to use Resend API

2. **SendGrid**
   ```bash
   npm install @sendgrid/mail
   ```
   Set `SENDGRID_API_KEY` environment variable

3. **AWS SES**
   ```bash
   npm install @aws-sdk/client-ses
   ```
   Configure AWS credentials

4. **Firebase Extensions - Trigger Email**
   - Install Firebase Extension: "Trigger Email"
   - Configure SMTP settings
   - Update email service to write to Firestore collection

5. **Nodemailer with SMTP**
   ```bash
   npm install nodemailer
   ```
   Configure SMTP settings

### Current Implementation

Currently, emails are:
- Logged to console for debugging
- Stored in `email_queue` collection in Firestore
- Marked as `sent: false` until email service is integrated

### Environment Variables Needed

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For invitation links
# Add email service API key based on provider chosen
```

## Support

For issues or questions regarding this feature, please refer to:
- API documentation in code comments
- Component prop types for UI components
- Error messages in API responses
- Email service setup instructions above

---

**Last Updated**: January 2024
**Version**: 1.1.0 (Added Invitation System)

