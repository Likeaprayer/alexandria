import express from 'express';
import {
  getTeachers,
  getTeacher,
  getTeacherStudents,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../handlers/teacher.handler';
import { cacheMiddleware } from '../middleware/cache-middleware';


const router = express.Router();

router.route('/')
  .get(cacheMiddleware(), getTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(cacheMiddleware(), getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.route('/:id/students')
  .get(cacheMiddleware(), getTeacherStudents);

export default router;
