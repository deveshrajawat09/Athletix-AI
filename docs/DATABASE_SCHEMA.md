# Athletix AI — Database Schema (MongoDB)

All collections are isolated per user via a `userId` field, indexed for fast lookups by user + date.

## `users`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| name | String | required |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt hash, never returned in API responses |
| createdAt | Date | |

## `health_profiles`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| userId | ObjectId → users | unique (one profile per user) |
| age, height (cm), weight (kg) | Number | |
| fitnessGoal | enum | weight_loss / muscle_gain / endurance / general_fitness / strength / maintenance |
| activityLevel | enum | sedentary / light / moderate / active / very_active |
| preferredWorkoutDays | [String] | Mon..Sun |
| preferredWorkoutTime | String | e.g. "06:30" |
| fitnessExperience | enum | beginner / intermediate / advanced |
| healthNotes | String | optional, max 1000 chars |
| bmi | Number (virtual) | computed from height+weight, informational only |
| updatedAt | Date | |

## `workouts`
| Field | Type | Notes |
|---|---|---|
| _id, userId, date | | indexed on (userId, date) |
| workoutName | String | |
| muscleGroup | enum | chest/back/legs/shoulders/arms/core/full_body/other |
| estimatedDurationMinutes, actualDurationMinutes | Number | |
| status | enum | planned / in_progress / completed / skipped |
| notes | String | |

## `workout_exercises`
| Field | Type | Notes |
|---|---|---|
| _id, workoutId → workouts | | |
| exerciseName | String | |
| sets | [{ setNumber, weight, reps, completed }] | |
| durationSeconds | Number | |
| status | enum | pending / in_progress / completed |

## `cardio_sessions`
| Field | Type | Notes |
|---|---|---|
| _id, userId, date | | indexed on (userId, date) |
| activityType | enum | running/walking/cycling/jogging/other |
| distanceKm, durationMinutes | Number | |
| calories, averageHeartRate | Number | |
| paceMinPerKm, speedKmH | Number (virtuals) | derived, never stored |
| status | enum | planned / completed / skipped |

## `daily_health_metrics`
| Field | Type | Notes |
|---|---|---|
| _id, userId, date | | unique on (userId, date) |
| heartRate, sleepDurationHours, steps, waterIntakeGlasses, weight, calories | Number, default null | "not available" if null |

## `goals`
| Field | Type | Notes |
|---|---|---|
| _id, userId | | |
| goalType | enum | run_distance / workouts_per_week / daily_steps / daily_water / weight_target / consistency |
| target, currentProgress | Number | |
| unit | String | |
| startDate, endDate | Date | |
| status | enum | active / completed / abandoned |

## `daily_plans`
| Field | Type | Notes |
|---|---|---|
| _id, userId, date | | unique on (userId, date) |
| plannedWorkout → workouts, plannedCardio → cardio_sessions | ObjectId | |
| completedTasks, pendingTasks | [String] | |

## `ai_conversations`
| Field | Type | Notes |
|---|---|---|
| _id, userId | | |
| message, response | String | |
| intent | enum | one of the 13 supported intents, or UNKNOWN |
| createdAt | Date | |
