import { rawPrisma } from '@repo/db';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';

export async function escalateSkippedTask(params: {
  tenantId: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  category: string;
  instructions?: string | null;
  residentId: string;
  residentName: string;
  branchId: string;
  skipReason: string;
  notificationsService: NotificationsService;
  auditService: AuditService;
}) {
  const highPriorityCategories = [
    'Medication',
    'Nutrition',
    'Hydration',
    'Clinical',
    'WoundCare',
    'Observations',
  ];
  const severity: 'High' | 'Medium' = highPriorityCategories.some((c) =>
    params.category.toLowerCase().includes(c.toLowerCase()),
  )
    ? 'High'
    : 'Medium';

  const onDutyClinician = await rawPrisma.user.findFirst({
    where: {
      tenantId: params.tenantId,
      isActive: true,
      role: { name: { in: ['Nurse', 'Manager'] } },
    },
    select: { id: true, fullName: true },
  });

  const escalation = await rawPrisma.clinicalEscalation.create({
    data: {
      tenantId: params.tenantId,
      branchId: params.branchId,
      residentId: params.residentId,
      raisedById: params.userId,
      assignedToRole: 'Nurse',
      assignedToId: onDutyClinician?.id || null,
      reason: 'SkippedTask',
      severity,
      status: 'Open',
      taskId: params.taskId,
      initialNotes: `Care plan task '${params.taskTitle}' was skipped. Reason: "${params.skipReason}". Automatic escalation triggered under CQC Reg 12/17.`,
      sbarSituation: `Mandatory care task '${params.taskTitle}' was skipped for ${params.residentName}.`,
      sbarBackground: `Category: ${params.category}. Instructions: ${params.instructions || 'Standard care plan delivery'}.`,
      sbarAssessment: `Carer recorded skip reason: "${params.skipReason}".`,
      sbarRecommendation: `Review resident clinical condition and determine if nurse intervention is needed.`,
    },
  });

  if (onDutyClinician?.id) {
    void params.notificationsService.triggerAlert({
      tenantId: params.tenantId,
      recipientId: onDutyClinician.id,
      title: `Skipped Task Alert: ${params.residentName}`,
      message: `Task '${params.taskTitle}' was skipped. Reason: "${params.skipReason}". Escalation #${escalation.id.slice(0, 8)} opened.`,
      category: 'CLINICAL',
      priority: severity === 'High' ? 'High' : 'Medium',
      metadata: {
        escalationId: escalation.id,
        residentId: params.residentId,
        taskId: params.taskId,
      },
    });
  }

  void params.auditService.emitSafeguarding({
    tenantId: params.tenantId,
    userId: params.userId,
    entityType: 'Incident',
    entityId: escalation.id,
    residentId: params.residentId,
    actionType: 'INCIDENT_REPORTED',
    description: `Clinical escalation opened for skipped task '${params.taskTitle}' (${params.residentName}).`,
    metadata: {
      escalationId: escalation.id,
      severity,
      skipReason: params.skipReason,
    },
  });

  return escalation;
}
