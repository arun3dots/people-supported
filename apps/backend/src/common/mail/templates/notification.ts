export function resolveActionUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
  let cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (cleanPath.startsWith('/incidents/')) {
    cleanPath = `/admin${cleanPath}`;
  }
  return `${baseUrl}${cleanPath}`;
}

export const notificationTemplate = (
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
) => {
  const resolvedUrl = resolveActionUrl(actionUrl);
  const logoUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/primary-logo.png`;

  return `
<div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px; text-align: left;">
    <div style="display: inline-block; padding: 12px 16px; background-color: #0b1220; border-radius: 12px;">
        <img src="${logoUrl}" alt="Cantra Care" style="height: 30px; width: auto; display: block;" />
    </div>
  </div>
  
  <h1 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 16px;">${title}</h1>
  
  <div style="color: #475569; font-size: 16px; line-height: 26px; margin-bottom: 32px;">
    ${message}
  </div>
  
  ${
    resolvedUrl
      ? `
  <div style="margin: 32px 0;">
    <a href="${resolvedUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
      ${actionLabel || 'View Details'}
    </a>
  </div>
  `
      : ''
  }
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
  
  <p style="color: #94a3b8; font-size: 12px;">
    Sent from Cantra Care Notification Engine.
    You are receiving this because it is related to your account activities.
  </p>
</div>
`;
};
