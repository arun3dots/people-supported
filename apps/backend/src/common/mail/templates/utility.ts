export const utilityTemplate = (
  header: string,
  body: string,
  footer?: string,
) => `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 20px; background-color: #ffffff;">
  <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
    <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0;">${header}</h2>
  </div>
  
  <div style="color: #334155; font-size: 15px; line-height: 24px; margin-bottom: 32px;">
    ${body}
  </div>
  
  ${
    footer
      ? `
  <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">
    ${footer}
  </div>
  `
      : `
  <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
    Automatic utility dispatch from Cantra Care.
  </div>
  `
  }
</div>
`;
