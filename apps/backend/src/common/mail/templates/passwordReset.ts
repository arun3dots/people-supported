export const passwordResetTemplate = (fullName: string, resetUrl: string) => `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px; text-align: left;">
    <div style="display: inline-block; padding: 12px 16px; background-color: #0b1220; border-radius: 12px;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/primary-logo.png" alt="Cantra Care" style="height: 30px; width: auto; display: block;" />
    </div>
  </div>
  
  <h1 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 16px;">Password Reset Request</h1>
  
  <div style="color: #475569; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
    Hello ${fullName},<br/><br/>
    We received a request to reset your password for your Cantra Care account.
  </div>

  <div style="margin: 32px 0;">
    <a href="${resetUrl}" style="background-color: #4A706A; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
      Reset Password
    </a>
  </div>
  
  <div style="color: #64748b; font-size: 14px; line-height: 22px; margin-bottom: 24px; background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <strong>Important:</strong> This password reset link is valid for <strong>5 minutes</strong> only. If you did not request a password reset, please ignore this email or contact support if you have concerns.
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
  
  <p style="color: #94a3b8; font-size: 12px;">
    Sent from Cantra Care Security Engine.<br/>
    If the button above does not work, copy and paste this link into your browser:<br/>
    <a href="${resetUrl}" style="color: #4A706A; word-break: break-all;">${resetUrl}</a>
  </p>
</div>
`;
