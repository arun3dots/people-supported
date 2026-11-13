import React, { useState } from 'react';
import { View } from 'react-native';
import type {
  CareTaskDefinitionDTO,
  NeedCarePlanContentDTO,
  NeedCarePlanRecordDTO,
} from '@repo/schema';
import { Button, Card, Text } from '../../presentation/components/common';
import { formatUkDate } from '../../lib/date';
import { supportPlanLabel } from '../../lib/supportPlanLabel';

const CONTENT_FIELDS: Array<[keyof NeedCarePlanContentDTO, string]> = [
  ['source', 'Information source'],
  ['found', 'Assessment findings'],
  ['needs', 'Support needs'],
  ['prefs', 'Preferences'],
  ['strengths', 'Strengths'],
  ['outcome', 'Desired outcome'],
  ['whatINeed', 'What I need'],
  ['howToSupportMe', 'How to support me'],
  ['staffing', 'Staffing'],
  ['monitor', 'Monitoring'],
  ['escalation', 'Escalation'],
  ['consent', 'Consent'],
  ['restrictions', 'Restrictions'],
];

export function RecordedSupportPlanCard({
  plan,
  tasks,
}: {
  plan: NeedCarePlanRecordDTO;
  tasks: CareTaskDefinitionDTO[];
}) {
  const [expanded, setExpanded] = useState(false);
  const planTasks = tasks.filter((task) => task.carePlanId === plan.id && task.isActive);
  return (
    <Card className="p-4 mb-4">
      <View className="flex-row justify-between items-start gap-3">
        <Text className="text-lg font-bold text-foreground flex-1">
          {supportPlanLabel(plan.area)}
        </Text>
        <Text className="text-sm font-semibold text-primary">{plan.status}</Text>
      </View>
      <Text className="text-sm text-muted-foreground mt-2">
        Version {plan.versionNumber} · {planTasks.length} active tasks
      </Text>
      <Text className="text-sm text-muted-foreground mt-1">
        Next review: {plan.reviewDate ? formatUkDate(plan.reviewDate) : 'Not recorded'}
      </Text>
      {plan.supportLevel && (
        <Text className="text-base text-foreground mt-2">Support level: {plan.supportLevel}</Text>
      )}
      {plan.risk && (
        <Text className="text-base text-foreground mt-2">
          {plan.risk.name}: {plan.risk.value} ({plan.risk.rating})
        </Text>
      )}
      <Button variant="ghost" className="mt-3" onPress={() => setExpanded(!expanded)}>
        {expanded ? 'Hide plan details' : 'View plan details'}
      </Button>
      {expanded && (
        <View className="gap-4 mt-3">
          {CONTENT_FIELDS.map(([key, label]) => {
            const value = plan.content[key];
            return typeof value === 'string' && value.trim() ? (
              <View key={key}>
                <Text className="text-base font-bold text-foreground">{label}</Text>
                <Text className="text-base text-muted-foreground mt-1">{value}</Text>
              </View>
            ) : null;
          })}
          {Boolean(plan.content.consultationPeople?.length) && (
            <View>
              <Text className="text-base font-bold text-foreground">People consulted</Text>
              {plan.content.consultationPeople?.map((person, index) => (
                <Text key={index} className="text-base text-muted-foreground">
                  {person.name} · {person.role}
                </Text>
              ))}
            </View>
          )}
          {Boolean(plan.content.steps?.length) && (
            <View>
              <Text className="text-base font-bold text-foreground">Support steps</Text>
              {plan.content.steps.map((step, index) => (
                <Text key={index} className="text-base text-muted-foreground mt-1">
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          )}
          <View>
            <Text className="text-base font-bold text-foreground">Scheduled tasks</Text>
            {planTasks.length === 0 ? (
              <Text className="text-base text-muted-foreground">No active tasks recorded</Text>
            ) : (
              planTasks.map((task) => (
                <View key={task.id} className="bg-white rounded-xl p-3 mt-2">
                  <Text className="text-base font-semibold text-foreground">{task.title}</Text>
                  {task.description && (
                    <Text className="text-base text-muted-foreground mt-1">{task.description}</Text>
                  )}
                  <Text className="text-sm text-muted-foreground mt-1">
                    {task.time || 'Flexible time'} · {task.shift} · {task.role}
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {task.recurrence.type === 'weekly'
                      ? `Weekly: ${task.recurrence.days.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}`
                      : 'Daily'}
                  </Text>
                </View>
              ))
            )}
          </View>
          {plan.agreement && (
            <View>
              <Text className="text-base font-bold text-foreground">Plan agreement</Text>
              {plan.agreement.agreedBy.map((person, index) => (
                <Text key={index} className="text-base text-muted-foreground">
                  {person.name} · {person.role}
                </Text>
              ))}
              <Text className="text-sm text-muted-foreground">
                {formatUkDate(plan.agreement.agreedAt)}
              </Text>
              {plan.agreement.note && (
                <Text className="text-base text-muted-foreground">{plan.agreement.note}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}
