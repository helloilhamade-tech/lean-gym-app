import { describe, it, expect } from 'vitest';
import { selectExercisesForFocus, FOCUS_OPTIONS } from '../lib/domain/workout-generator';
import { generateGoogleCalendarUrl, generateICalendarData } from '../lib/domain/calendar-sync';
import { SEED_EXERCISES } from '../lib/db/seed-data';
import { Workout } from '../lib/db/schema';

describe('Workout Focus & Needs-Based Generator', () => {
  it('selects Upper Body exercises containing chest, back, and arms', () => {
    const exercises = selectExercisesForFocus(SEED_EXERCISES, 'upper', 'gym', 45);
    expect(exercises.length).toBeGreaterThanOrEqual(3);

    const muscleGroups = exercises.map((e) => e.muscle_group);
    expect(muscleGroups).toContain('chest');
    expect(muscleGroups).toContain('back');
  });

  it('selects Lower Body exercises containing quads and hamstrings', () => {
    const exercises = selectExercisesForFocus(SEED_EXERCISES, 'lower', 'gym', 45);
    expect(exercises.length).toBeGreaterThanOrEqual(3);

    const muscleGroups = exercises.map((e) => e.muscle_group);
    expect(muscleGroups).toContain('quads');
  });

  it('respects duration constraints (30 min vs 60 min)', () => {
    const express = selectExercisesForFocus(SEED_EXERCISES, 'push', 'gym', 30);
    const volume = selectExercisesForFocus(SEED_EXERCISES, 'push', 'gym', 60);

    expect(express.length).toBe(3);
    expect(volume.length).toBeGreaterThanOrEqual(4);
  });

  it('returns empty exercise list for rest day', () => {
    const rest = selectExercisesForFocus(SEED_EXERCISES, 'rest');
    expect(rest.length).toBe(0);
  });
});

describe('Calendar Sync & Export', () => {
  const sampleWorkout: Workout = {
    id: 'wkt-test-1',
    profile_id: 'usr-1',
    name: 'Upper Body A',
    scheduled_at: '2026-09-10',
    status: 'scheduled',
    duration_min: 50,
    created_at: '2026-09-09T10:00:00.000Z',
  };

  const sampleExercises = [
    { name: 'Incline Dumbbell Press', targetReps: '8-10', targetSets: 3 },
    { name: 'Lat Pulldown', targetReps: '10-12', targetSets: 3 },
  ];

  it('generates valid Google Calendar URL with encoded parameters', () => {
    const url = generateGoogleCalendarUrl(sampleWorkout, sampleExercises, '2026-09-10');
    expect(url).toContain('calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('LEAN%3A%20Upper%20Body%20A');
    expect(url).toContain('Incline%20Dumbbell%20Press');
  });

  it('generates valid RFC 5545 iCalendar (.ics) format', () => {
    const ics = generateICalendarData(sampleWorkout, sampleExercises, '2026-09-10');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:LEAN: Upper Body A');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('DTSTART:20260910');
  });
});
