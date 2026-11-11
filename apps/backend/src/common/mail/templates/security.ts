export const securityTemplate = (
  alertType: string,
  details: string,
  actionUrl?: string,
) => `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #fee2e2; border-radius: 20px; background-color: #fffafb;">
  <div style="margin-bottom: 32px; text-align: center;">
    <div style="display: inline-block; padding: 16px 22px; background-color: #0b1220; border-radius: 16px;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/primary-logo.png" alt="Cantra Care" style="height: 32px; width: auto; display: block;" />
    </div>
  </div>
  
  <h1 style="color: #991b1b; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">Security Alert: ${alertType}</h1>
  
  <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center;">
    We detected a security-related action on your account. Please review the details below to ensure it was intended.
  </p>
  
  <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 16px; padding: 24px; margin: 32px 0;">
    <p style="color: #374151; font-size: 14px; margin: 0; line-height: 22px;">
      ${details}
    </p>
  </div>
  
  ${
    actionUrl
      ? `
  <div style="text-align: center; margin: 32px 0;">
    <a href="${actionUrl}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
      Review Account Activity
    </a>
  </div>
  `
      : ''
  }
  
  <div style="padding: 20px; background-color: #fef2f2; border-radius: 12px; color: #991b1b; font-size: 13px; font-weight: 500;">
    <strong>Important:</strong> If you did not perform this action, please contact support immediately or reset your password.
  </div>
  
  <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 32px 0;" />
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Secure Infrastructure Layer &bull; Cantra Care
  </p>
</div>
`;
