// /lib/emailService.ts
// Email service for sending invitations and notifications using SendGrid

import sgMail from '@sendgrid/mail';
import { adminDb } from './firebaseAdmin';

// Initialize SendGrid with API key
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

// Get the "from" email address - hardcoded to verified email
// SendGrid requires the from address to match a verified Sender Identity
// IMPORTANT: Verify this email at https://app.sendgrid.com/settings/sender_auth/senders/new
// Click "Verify a Single Sender" and add dewanshshukla2002@gmail.com
// Use just the email address (no display name) for better compatibility
const FROM_EMAIL = 'dewanshshukla2002@gmail.com';
/**
 * Send email invitation for trip collaboration using SendGrid
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  tripName: string,
  invitationLink: string
): Promise<void> {
  const subject = `${inviterName} invited you to collaborate on a trip`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trip Collaboration Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Trip Collaboration Invitation</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi there!</p>
        <p style="font-size: 16px;">
          <strong>${inviterName}</strong> has invited you to collaborate on their trip: <strong>${tripName}</strong>
        </p>
        <p style="font-size: 16px;">
          As a collaborator, you'll be able to:
        </p>
        <ul style="font-size: 16px;">
          <li>View and edit the trip itinerary</li>
          <li>Add and manage expenses</li>
          <li>Track expenses and splits with the group</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    display: inline-block;
                    font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you don't have an account yet, clicking the link will allow you to sign up and then join the trip automatically.
        </p>
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">
          ${invitationLink}
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Trip Collaboration Invitation

Hi there!

${inviterName} has invited you to collaborate on their trip: ${tripName}

As a collaborator, you'll be able to:
- View and edit the trip itinerary
- Add and manage expenses
- Track expenses and splits with the group

Accept the invitation by clicking this link:
${invitationLink}

If you don't have an account yet, clicking the link will allow you to sign up and then join the trip automatically.

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
  `;

  // Send email using SendGrid
  try {
    if (!sendGridApiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not set. Email will not be sent.');
      console.warn('⚠️ Please set SENDGRID_API_KEY in your .env.local file');
      // Still queue for debugging
      await adminDb.collection('email_queue').add({
        to: email,
        subject,
        html,
        text,
        type: 'invitation',
        createdAt: new Date(),
        sent: false,
        error: 'SENDGRID_API_KEY not configured',
      });
      return;
    }

    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject,
      html,
      text,
    };

    const [response] = await sgMail.send(msg);

    console.log('✅ Invitation email sent successfully:', {
      to: email,
      subject,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
    });

    // Log successful send for debugging
    await adminDb.collection('email_queue').add({
      to: email,
      subject,
      html,
      text,
      type: 'invitation',
      createdAt: new Date(),
      sent: true,
      sendGridStatus: response.statusCode,
      sendGridMessageId: response.headers['x-message-id'],
    });
  } catch (error) {
    console.error('❌ Error in sendInvitationEmail:', error);
    
    // SendGrid error handling
    const sendGridError = error as { response?: { body?: { errors?: unknown[] } } };
    const errorDetails = sendGridError.response?.body?.errors || [];
    
    console.error('❌ SendGrid Error Details:', JSON.stringify(errorDetails, null, 2));
    
    // Check if it's a sender identity error
    const senderIdentityError = errorDetails.some((err: unknown) => 
      err?.message?.includes('Sender Identity') || 
      err?.message?.includes('verified Sender')
    );
    
    if (senderIdentityError) {
      console.error('⚠️ Sender Identity Issue Detected:');
      console.error('   1. Verify the email is verified at: https://app.sendgrid.com/settings/sender_auth/senders');
      console.error('   2. Make sure verification is complete (check email inbox for verification link)');
      console.error('   3. Wait a few minutes after verification for SendGrid to update');
      console.error('   4. The from email must match EXACTLY: dewanshshukla2002@gmail.com');
      console.error('   5. Check sender status shows "Verified" (not "Pending")');
    }
    
    // Don't throw - email failure shouldn't break invitation creation
    // But log it for monitoring
    try {
      await adminDb.collection('email_queue').add({
        to: email,
        subject,
        html,
        text,
        type: 'invitation',
        createdAt: new Date(),
        sent: false,
        error: error instanceof Error ? error.message : String(error),
        sendGridError: errorDetails,
      });
    } catch (queueError) {
      console.error('Error queuing failed email:', queueError);
    }
    
    console.warn('⚠️ Email sending failed, but invitation creation will continue');
    console.warn('⚠️ User can still access the trip via the invitation link');
  }
}

/**
 * Send email notification when user is added as collaborator (existing user) using SendGrid
 */
export async function sendCollaboratorAddedEmail(
  email: string,
  inviterName: string,
  tripName: string,
  tripLink: string
): Promise<void> {
  const subject = `You've been added to ${tripName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Added to Trip</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">You've been added to a trip!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi there!</p>
        <p style="font-size: 16px;">
          <strong>${inviterName}</strong> has added you as a collaborator to their trip: <strong>${tripName}</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${tripLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    display: inline-block;
                    font-size: 16px;">
            View Trip
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
You've been added to a trip!

Hi there!

${inviterName} has added you as a collaborator to their trip: ${tripName}

View the trip here:
${tripLink}
  `;

  // Send email using SendGrid
  try {
    if (!sendGridApiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not set. Email will not be sent.');
      console.warn('⚠️ Please set SENDGRID_API_KEY in your .env.local file');
      // Still queue for debugging
      await adminDb.collection('email_queue').add({
        to: email,
        subject,
        html,
        text,
        type: 'collaborator_added',
        createdAt: new Date(),
        sent: false,
        error: 'SENDGRID_API_KEY not configured',
      });
      return;
    }

    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject,
      html,
      text,
    };

    const [response] = await sgMail.send(msg);

    console.log('✅ Collaborator added email sent successfully:', {
      to: email,
      subject,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
    });

    // Log successful send for debugging
    await adminDb.collection('email_queue').add({
      to: email,
      subject,
      html,
      text,
      type: 'collaborator_added',
      createdAt: new Date(),
      sent: true,
      sendGridStatus: response.statusCode,
      sendGridMessageId: response.headers['x-message-id'],
    });
  } catch (error) {
    console.error('❌ Error in sendCollaboratorAddedEmail:', error);
    
    // SendGrid error handling
    const sendGridError = error as { response?: { body?: { errors?: unknown[] } } };
    const errorDetails = sendGridError.response?.body?.errors || [];
    
    console.error('❌ SendGrid Error Details:', JSON.stringify(errorDetails, null, 2));
    
    // Check if it's a sender identity error
    const senderIdentityError = errorDetails.some((err: unknown) => 
      err?.message?.includes('Sender Identity') || 
      err?.message?.includes('verified Sender')
    );
    
    if (senderIdentityError) {
      console.error('⚠️ Sender Identity Issue Detected:');
      console.error('   1. Verify the email is verified at: https://app.sendgrid.com/settings/sender_auth/senders');
      console.error('   2. Make sure verification is complete (check email inbox for verification link)');
      console.error('   3. Wait a few minutes after verification for SendGrid to update');
      console.error('   4. The from email must match EXACTLY: dewanshshukla2002@gmail.com');
      console.error('   5. Check sender status shows "Verified" (not "Pending")');
    }
    
    // Don't throw - email failure shouldn't break collaborator addition
    // But log it for monitoring
    try {
      await adminDb.collection('email_queue').add({
        to: email,
        subject,
        html,
        text,
        type: 'collaborator_added',
        createdAt: new Date(),
        sent: false,
        error: error instanceof Error ? error.message : String(error),
        sendGridError: errorDetails,
      });
    } catch (queueError) {
      console.error('Error queuing failed email:', queueError);
    }
    
    console.warn('⚠️ Email sending failed, but collaborator addition will continue');
  }
}

