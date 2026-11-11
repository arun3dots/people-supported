export const otpTemplate = (otpCode: string, expiryMinutes: number = 10) => `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px; text-align: center;">
    <div style="display: inline-block; padding: 16px 22px; background-color: #0b1220; border-radius: 16px;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/primary-logo.png" alt="Cantra Care" style="height: 36px; width: auto; display: block;" />
    </div>
  </div>
  
  <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin-bottom: 12px; text-align: center;">Verification Code</h1>
  <p style="color: #64748b; font-size: 16px; text-align: center; margin-bottom: 32px;">Please use the following code to complete your login.</p>
  
  <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px; font-weight: 800; color: #0f172a; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otpCode}</span>
  </div>
  
  <p style="color: #475569; font-size: 14px; text-align: center; line-height: 20px;">
    This code will expire in <strong>${expiryMinutes} minutes</strong>.<br/>
    If you did not request this code, you can safely ignore this email.
  </p>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
  
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    &copy; 2026 Cantra Care. Secure Access Layer.
  </p>
</div>
`;
