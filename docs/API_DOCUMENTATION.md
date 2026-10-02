# Athletix AI — API Documentation

Base URL: `http://localhost:5000/api`
Auth: `Authorization: Bearer <jwt>` on all routes except register/login.

## Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | /auth/register | `{ name, email, password }` | password ≥ 8 chars; returns `{ token, user }` |
| POST | /auth/login | `{ email, password }` | returns `{ token, user }` |
| GET | /auth/me | — | returns current user |

## Health
| Method | Route | Body / Query |
|---|---|---|
| GET | /health/profile | — |
| POST | /health/profile | health profile fields (fails if one exists) |
| PUT | /health/profile | health profile fields (upserts) |
| POST | /health/metrics | `{ date?, heartRate?, sleepDurationHours?, steps?, waterIntakeGlasses?, weight?, calories? }` |
| GET | /health/metrics | `?from=&to=` (ISO dates) |

## Workouts
| Method | Route | Body / Query |
|---|---|---|
| GET | /workouts | `?from=&to=&status=` |
| POST | /workouts | `{ date, workoutName, muscleGroup, estimatedDurationMinutes?, exercises?: [{exerciseName, sets}] }` |
| GET | /workouts/:id | — |
| PUT | /workouts/:id | any workout fields |
| DELETE | /workouts/:id | — |
| GET | /workouts/records/all | personal records (max weight/reps/session volume per exercise) |

## Cardio
| Method | Route | Body / Query |
|---|---|---|
| GET | /cardio | `?from=&to=` |
| POST | /cardio | `{ date, activityType, distanceKm?, durationMinutes?, calories?, averageHeartRate? }` — pace/speed are computed, not stored |
| GET | /cardio/:id | — |
| PUT | /cardio/:id | — |
| DELETE | /cardio/:id | — |

## Dashboard
| Method | Route | Notes |
|---|---|---|
| GET | /dashboard/today | today's workout, cardio, health metrics, pending tasks — all fields `null` if unrecorded |
| GET | /dashboard/summary | `?date=YYYY-MM-DD`, defaults to today |
| GET | /dashboard/progress | `?range=week|month` — totals for completed workouts/cardio |

## Goals
| Method | Route | Body |
|---|---|---|
| GET | /goals | — |
| POST | /goals | `{ goalType, target, unit?, startDate, endDate? }` |
| PUT | /goals/:id | — |
| DELETE | /goals/:id | — |

## AI
| Method | Route | Body / Query |
|---|---|---|
| POST | /ai/chat | `{ message }` → `{ intent, response, execution }` |
| POST | /ai/voice | `{ transcript }` → same shape as /ai/chat |
| GET | /ai/daily-briefing | `?type=morning|evening` → `{ response }` |

All AI responses are grounded in data pulled from MongoDB by the backend
(`services/contextBuilder.js`) and passed to the Python AI service — the AI
never invents workouts, distances, or health readings, and never writes to
the database directly. Writes (SAVE_SET, SAVE_CARDIO) are executed and
validated only inside `controllers/aiController.js`.
