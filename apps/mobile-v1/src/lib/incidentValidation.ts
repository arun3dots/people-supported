import type {
  IncidentDetailsFormState,
  ResidentOption,
} from '../components/incident/IncidentDetailsCard';

export function incidentValidationError(
  form: IncidentDetailsFormState,
  people: ResidentOption[],
  today: string,
): string | null {
  if (!form.incidentName.trim()) return 'Please enter an incident name or title.';
  if (!form.residentId || !people.some((person) => person.id === form.residentId))
    return 'Please select the affected person supported.';
  if (!form.category) return 'Please select an incident category.';
  if (!['Low', 'Medium', 'High', 'Critical'].includes(form.severity))
    return 'Please select the incident severity.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.incidentTime))
    return 'Please enter a valid incident time (HH:mm).';
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.incidentDate) ||
    !Number.isFinite(new Date(`${form.incidentDate}T00:00:00Z`).getTime()) ||
    new Date(`${form.incidentDate}T00:00:00Z`).toISOString().slice(0, 10) !== form.incidentDate
  )
    return 'Please select a valid incident date.';
  if (form.incidentDate > today) return 'The incident date cannot be in the future.';
  return null;
}
