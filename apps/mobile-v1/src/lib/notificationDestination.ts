import type { Href } from 'expo-router';

interface NotificationAction {
  actionUrl?: string | null;
  title?: string;
  category?: string;
}

/** Notifications share web links; resolve only routes implemented by the mobile app. */
export function notificationDestination(notification: NotificationAction): Href {
  let path: string;
  try {
    path =
      new URL(notification.actionUrl || '/', 'https://mobile.invalid').pathname.replace(
        /\/$/,
        '',
      ) || '/';
  } catch {
    return '/alerts';
  }
  const category = notification.category?.toUpperCase() ?? '';
  const title = notification.title?.toLowerCase() ?? '';

  if (
    /^\/(?:carer\/rota|admin\/(?:staff\/rota|rota|shifts)|shifts)(?:\/|$)/i.test(path) ||
    category === 'SHIFT' ||
    title.includes('upcoming shift')
  ) {
    return { pathname: '/', params: { openShiftDetails: 'true', tab: 'weekly' } };
  }

  const person = path.match(/^\/(?:admin\/)?residents\/([^/]+)(?:\/(.*))?$/i);
  const personId = person?.[1];
  const section = person?.[2]?.toLowerCase() ?? '';
  if (
    category === 'MEDICATION' ||
    /medication|^mar$/.test(section) ||
    path === '/mar' ||
    title.includes('medication')
  ) {
    return personId ? { pathname: '/mar', params: { id: personId } } : '/mar';
  }
  if (category === 'TASK' || section === 'tasks' || path === '/tasks' || title.includes('task'))
    return '/tasks';
  if (
    category === 'CLINICAL' ||
    /observation/.test(section) ||
    path === '/news2' ||
    title.includes('news2') ||
    title.includes('vital')
  ) {
    return personId ? { pathname: '/news2', params: { id: personId } } : '/news2';
  }
  if (category === 'INCIDENT' || /\/incidents?(?:\/|$)/i.test(path) || path === '/report-incident')
    return '/report-incident';
  if (personId) return { pathname: '/resident-details', params: { id: personId } };
  if (path === '/handover' || path === '/previous-handover') return '/previous-handover';
  if (
    ['/residents', '/alerts', '/documents', '/care-notes', '/care-plan', '/body-map'].includes(path)
  )
    return path as Href;
  if (path === '/dashboard' || (path === '/' && notification.actionUrl)) return '/';
  return '/alerts';
}
