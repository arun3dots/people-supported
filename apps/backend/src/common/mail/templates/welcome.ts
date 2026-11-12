export const welcomeTemplate = (
  tenantName: string,
  subdomain: string,
  verificationUrl: string,
) => `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px; text-align: center;">
    <div style="display: inline-block; padding: 16px 22px; background-color: #0b1220; border-radius: 16px;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/primary-logo.png" alt="Cantra Care" style="height: 36px; width: auto; display: block;" />
    </div>
  </div>

  <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin-bottom: 24px; text-align: center;">Activate Your Cantra Care Environment</h1>
  
  <p style="color: #475569; font-size: 16px; line-height: 24px;">Hi there,</p>
  
  <p style="color: #475569; font-size: 16px; line-height: 24px;">
    Infrastructure for <strong>${tenantName}</strong> has been successfully provisioned on our platform. 
    Your dedicated subdomain is ready at <strong>${subdomain}.cantracare.com</strong>.
  </p>
  
  <p style="color: #475569; font-size: 16px; line-height: 24px;">
    To activate your administrator account and begin configuring your supported living service, please verify your email address:
  </p>
  
  <div style="margin: 40px 0; text-align: center;">
    <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
      Verify Email Address
    </a>
  </div>
  
  <div style="padding: 24px; background-color: #f1f5f9; border-radius: 16px; margin-bottom: 32px;">
    <h4 style="color: #334155; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Subdomain Details</h4>
    <code style="color: #2563eb; font-size: 13px; font-weight: 600;">${subdomain}.cantracare.com</code>
  </div>
  
  <p style="color: #64748b; font-size: 14px; line-height: 20px;">
    If the button above does not work, please copy and paste the following link into your browser to verify:
  </p>
  <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin-top: 8px;">
    ${verificationUrl}
  </p>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
  
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    &copy; 2026 Cantra Care. All rights reserved.<br/>
    This is an automated security email. Please do not reply.
  </p>
</div>
`;
