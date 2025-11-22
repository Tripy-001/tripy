# Email Setup Guide

## Current Status

SendGrid is configured and allows sending emails to any email address:
- **Free Tier**: 100 emails/day - Can send to any email address
- **No domain verification required** for basic sending
- **Recommended**: Verify your sender email for better deliverability

## SendGrid Setup

### Step 1: Get SendGrid API Key

1. **Sign up for SendGrid** (if you haven't already):
   - Go to https://signup.sendgrid.com/
   - Create a free account (100 emails/day)

2. **Create API Key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Give it a name (e.g., "Tripy Production")
   - Select "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (you'll only see it once!)

3. **Add to `.env.local`**:
   ```env
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=Tripy <noreply@tripy.app>
   ```

### Step 2: Verify Sender Email (Recommended)

While SendGrid allows sending without verification, verifying your sender email improves deliverability:

1. Go to https://app.sendgrid.com/settings/sender_auth/senders/new
2. Add your email address
3. Verify via email link
4. Update `SENDGRID_FROM_EMAIL` to use your verified email

### Step 3: Test

1. Restart your dev server
2. Try inviting a collaborator
3. Check the console logs for success/error messages
4. Check the `email_queue` collection in Firestore for email records

## Alternative Options (If Needed)

### Option 1: Use Free Domain Services

You can get a free domain from these services:

1. **Freenom** (https://www.freenom.com)
   - Free `.tk`, `.ml`, `.ga`, `.cf` domains
   - Can verify with Resend

2. **Namecheap Free DNS** (https://www.namecheap.com)
   - Use with free subdomain services

3. **Cloudflare** (https://www.cloudflare.com)
   - Free domain registration (limited availability)
   - Free DNS hosting

4. **GitHub Student Pack** (if you're a student)
   - Includes free domain from Namecheap

### Option 2: Use Your Existing Domain

If you have any domain (even a personal one), you can:
1. Add DNS records to verify with Resend
2. Use a subdomain like `noreply@yourdomain.com`

### Option 3: Use Alternative Email Services

#### A. SendGrid (Free Tier: 100 emails/day)
```bash
npm install @sendgrid/mail
```

Update `lib/emailService.ts`:
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
await sgMail.send({
  to: email,
  from: 'noreply@yourdomain.com',
  subject,
  html,
  text,
});
```

#### B. AWS SES (Free Tier: 62,000 emails/month)
- Requires AWS account
- Can use without domain (with limitations)
- More complex setup

#### C. Mailgun (Free Tier: 5,000 emails/month)
```bash
npm install mailgun.js
```

#### D. Postmark (Free Tier: 100 emails/month)
- Simple API
- Good for transactional emails

### Option 4: Development Workaround

For development/testing, you can:

1. **Send to your own email only**
   - Set `RESEND_TEST_EMAIL=dewanshshukla2002@gmail.com` in `.env.local`
   - Only emails to this address will be sent
   - Other emails will be queued

2. **Show invitation link in UI**
   - The invitation link is still generated
   - You can copy and share it manually
   - Users can access without email

3. **Use invitation link directly**
   - The invitation system works without email
   - Users can access via `/invitations/accept?token=...&tripId=...`

## Quick Setup: Verify Domain in Resend

1. **Get a free domain** (see Option 1 above)

2. **Add domain to Resend**:
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain

3. **Add DNS records**:
   - Resend will show you DNS records to add
   - Add them to your domain's DNS settings
   - Wait for verification (usually 5-10 minutes)

4. **Update environment variable**:
   ```env
   RESEND_FROM_EMAIL=Tripy <noreply@yourdomain.com>
   ```

5. **Restart your server**

## Current Configuration

Your `.env.local` should have:
```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=Tripy <noreply@tripy.app>
```

## How It Works Now

1. **SendGrid allows sending to any email**:
   - ✅ Emails will be sent successfully to any recipient
   - ✅ No domain verification required (but recommended)
   - ✅ Free tier: 100 emails/day

2. **If email sending fails**:
   - ⚠️ Email will be queued in Firestore
   - ✅ Invitation is still created
   - ✅ User can access via invitation link
   - ✅ You can manually share the invitation link

## Testing Without Domain

To test the invitation flow:

1. Invite yourself (`dewanshshukla2002@gmail.com`) - email will work
2. Invite others - invitation link will be created, you can share it manually
3. Users can access via: `/invitations/accept?token=...&tripId=...`

## Production Recommendation

For production, you should:
1. Get a domain (even a free one)
2. Verify it with Resend
3. Update `RESEND_FROM_EMAIL` to use your domain
4. This enables sending to any email address

---

**Note**: The invitation system works perfectly fine without email - users can access invitations via the link. Email is just a convenience feature for notifications.

