const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getWorkouts,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  addExercise,
  addSet,
  deleteExercise,
  getPersonalRecords,
} = require('../controllers/workoutController');

const router = express.Router();
router.use(protect);

router.get('/records/all', getPersonalRecords); // before /:id so it isn't captured as an id
router.get('/', getWorkouts);
router.post('/', createWorkout);
router.get('/:id', getWorkoutById);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

router.post('/:id/exercises', addExercise);
router.post('/:id/exercises/:exerciseId/sets', addSet);
router.delete('/:id/exercises/:exerciseId', deleteExercise);

module.exports = router;
