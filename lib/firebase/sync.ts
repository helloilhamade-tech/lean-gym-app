import {
  collection,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { firestore, isFirebaseConfigured } from './config';
import { db } from '@/lib/db/dexie-db';
import { Workout, SetEntry, Measurement, Meal, WorkoutExercise } from '@/lib/db/schema';

export interface SyncResult {
  success: boolean;
  syncedWorkouts: number;
  syncedSets: number;
  syncedMeasurements: number;
  syncedMeals: number;
  error?: string;
}

/**
 * Upload local Dexie changes to Cloud Firestore
 */
export async function syncLocalToCloud(userId: string): Promise<SyncResult> {
  if (!isFirebaseConfigured || !firestore || !userId) {
    return {
      success: false,
      syncedWorkouts: 0,
      syncedSets: 0,
      syncedMeasurements: 0,
      syncedMeals: 0,
      error: 'Firebase not configured or user not authenticated',
    };
  }

  try {
    const workouts = await db.workouts.toArray();
    const sets = await db.sets.toArray();
    const measurements = await db.measurements.toArray();
    const meals = await db.meals.toArray();
    const workoutExercises = await db.workoutExercises.toArray();

    // 1. Sync workouts
    for (const w of workouts) {
      const ref = doc(firestore, `users/${userId}/workouts`, w.id);
      await setDoc(ref, { ...w, updated_at: new Date().toISOString() }, { merge: true });
    }

    // 2. Sync workout exercises
    for (const we of workoutExercises) {
      const ref = doc(firestore, `users/${userId}/workout_exercises`, we.id);
      await setDoc(ref, { ...we, updated_at: new Date().toISOString() }, { merge: true });
    }

    // 3. Sync sets
    for (const s of sets) {
      const ref = doc(firestore, `users/${userId}/sets`, s.id);
      await setDoc(ref, { ...s, updated_at: new Date().toISOString() }, { merge: true });
    }

    // 4. Sync measurements
    for (const m of measurements) {
      const ref = doc(firestore, `users/${userId}/measurements`, m.id);
      await setDoc(ref, { ...m, updated_at: new Date().toISOString() }, { merge: true });
    }

    // 5. Sync meals
    for (const meal of meals) {
      const ref = doc(firestore, `users/${userId}/meals`, meal.id);
      await setDoc(ref, { ...meal, updated_at: new Date().toISOString() }, { merge: true });
    }

    return {
      success: true,
      syncedWorkouts: workouts.length,
      syncedSets: sets.length,
      syncedMeasurements: measurements.length,
      syncedMeals: meals.length,
    };
  } catch (err: any) {
    console.error('Failed to sync to cloud:', err);
    return {
      success: false,
      syncedWorkouts: 0,
      syncedSets: 0,
      syncedMeasurements: 0,
      syncedMeals: 0,
      error: err.message,
    };
  }
}

/**
 * Download remote Cloud Firestore data and merge into local Dexie
 */
export async function syncCloudToLocal(userId: string): Promise<SyncResult> {
  if (!isFirebaseConfigured || !firestore || !userId) {
    return {
      success: false,
      syncedWorkouts: 0,
      syncedSets: 0,
      syncedMeasurements: 0,
      syncedMeals: 0,
      error: 'Firebase not configured or user not authenticated',
    };
  }

  try {
    let syncedWorkouts = 0;
    let syncedSets = 0;
    let syncedMeasurements = 0;
    let syncedMeals = 0;

    // Fetch workouts
    const workoutsSnap = await getDocs(collection(firestore, `users/${userId}/workouts`));
    for (const d of workoutsSnap.docs) {
      await db.workouts.put(d.data() as Workout);
      syncedWorkouts++;
    }

    // Fetch workout exercises
    const weSnap = await getDocs(collection(firestore, `users/${userId}/workout_exercises`));
    for (const d of weSnap.docs) {
      await db.workoutExercises.put(d.data() as WorkoutExercise);
    }

    // Fetch sets
    const setsSnap = await getDocs(collection(firestore, `users/${userId}/sets`));
    for (const d of setsSnap.docs) {
      await db.sets.put(d.data() as SetEntry);
      syncedSets++;
    }

    // Fetch measurements
    const measSnap = await getDocs(collection(firestore, `users/${userId}/measurements`));
    for (const d of measSnap.docs) {
      await db.measurements.put(d.data() as Measurement);
      syncedMeasurements++;
    }

    // Fetch meals
    const mealsSnap = await getDocs(collection(firestore, `users/${userId}/meals`));
    for (const d of mealsSnap.docs) {
      await db.meals.put(d.data() as Meal);
      syncedMeals++;
    }

    return {
      success: true,
      syncedWorkouts,
      syncedSets,
      syncedMeasurements,
      syncedMeals,
    };
  } catch (err: any) {
    console.error('Failed to sync from cloud:', err);
    return {
      success: false,
      syncedWorkouts: 0,
      syncedSets: 0,
      syncedMeasurements: 0,
      syncedMeals: 0,
      error: err.message,
    };
  }
}
