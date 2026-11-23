export function buildNokEmailHtml(
  residentName: string,
  recipientName: string,
  incidentNumber: string,
  category: string,
  incidentDate: Date,
  message: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3D5C57; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Incident & Care Update</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Resident: ${residentName}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p>Dear ${recipientName},</p>
        <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #3D5C57; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">Incident Reference: ${incidentNumber}</p>
          <p style="margin: 0; font-size: 14px; color: #475569;">Category: ${category} | Date: ${new Date(incidentDate).toLocaleDateString('en-GB')}</p>
        </div>
        <p style="white-space: pre-wrap; margin: 16px 0; font-size: 14px; color: #334155;">${message}</p>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Please contact our care management team if you have any questions or require additional support.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an official care communication sent by Cantra Care.
        </p>
      </div>
    </div>
  `;
}

export function buildTaskAssignedEmailHtml(
  staffName: string,
  incidentNumber: string,
  taskTitle: string,
  taskDescription: string,
  taskDate: string,
  taskTime: string,
  priority: string,
  actionUrl: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3D5C57; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Incident Follow-up Task Assigned</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Incident Reference: ${incidentNumber}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p>Hello ${staffName},</p>
        <p>You have been assigned an action task related to incident <strong>${incidentNumber}</strong>:</p>
        <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #3D5C57; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 16px; color: #1e293b;">${taskTitle}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;">${taskDescription || 'No additional instructions provided.'}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            <strong>Due:</strong> ${taskDate || 'Immediate'} ${taskTime ? `at ${taskTime}` : ''} | <strong>Priority:</strong> ${priority}
          </p>
        </div>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${actionUrl}" style="background-color: #3D5C57; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Incident & Task
          </a>
        </div>
      </div>
    </div>
  `;
}
