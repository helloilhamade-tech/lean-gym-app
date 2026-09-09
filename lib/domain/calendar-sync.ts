import { Workout } from '@/lib/db/schema';

export interface ExerciseSummary {
  name: string;
  targetReps: string;
  targetSets: number;
}

/**
 * Formats a Date object to YYYYMMDDTHHmmssZ format for calendar URLs and iCal.
 */
export function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate 1-tap Google Calendar Web URL
 */
export function generateGoogleCalendarUrl(
  workout: Workout,
  exercises: ExerciseSummary[] = [],
  dateStr?: string
): string {
  const targetDate = dateStr || workout.scheduled_at || new Date().toISOString().split('T')[0];
  
  // Default to 08:00 AM on target date
  const [year, month, day] = targetDate.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, 8, 0, 0);
  const durationMin = workout.duration_min || 50;
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const title = `LEAN: ${workout.name}`;

  const exerciseList = exercises.length > 0
    ? exercises.map((e, idx) => `${idx + 1}. ${e.name} (${e.targetSets} set × ${e.targetReps} reps)`).join('\n')
    : 'Latihan gym harian yang dipersonalisasi.';

  const details = `${exerciseList}\n\nLacak beban & progressive overload di: https://lean-gym-app.vercel.app/workout/active`;
  const location = 'Gym / Pusat Kebugaran';

  const startIso = formatCalendarDate(startDate);
  const endIso = formatCalendarDate(endDate);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    location
  )}&dates=${startIso}/${endIso}`;
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) content for Apple Calendar, Android, & Outlook
 */
export function generateICalendarData(
  workout: Workout,
  exercises: ExerciseSummary[] = [],
  dateStr?: string
): string {
  const targetDate = dateStr || workout.scheduled_at || new Date().toISOString().split('T')[0];
  const [year, month, day] = targetDate.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, 8, 0, 0);
  const durationMin = workout.duration_min || 50;
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const title = `LEAN: ${workout.name}`;
  const exerciseList = exercises.length > 0
    ? exercises.map((e, idx) => `${idx + 1}. ${e.name} (${e.targetSets} set x ${e.targetReps} reps)`).join('\\n')
    : 'Latihan gym harian.';

  const details = `${exerciseList}\\n\\nBuka di: https://lean-gym-app.vercel.app`;
  const startIso = formatCalendarDate(startDate);
  const endIso = formatCalendarDate(endDate);
  const stampIso = formatCalendarDate(new Date());
  const uid = `lean-${workout.id || Date.now()}@lean-gym-app.vercel.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LEAN Gym Tracker//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    'LOCATION:Gym / Pusat Kebugaran',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Persiapan Latihan Gym LEAN',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers an immediate .ics download in the browser
 */
export function downloadICSFile(
  workout: Workout,
  exercises: ExerciseSummary[] = [],
  dateStr?: string
): void {
  const icsData = generateICalendarData(workout, exercises, dateStr);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lean-workout-${dateStr || workout.scheduled_at || 'schedule'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
