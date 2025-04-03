import express from 'express';
import {
  getTeachers,
  getTeacher,
  getTeacherStudents,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../handlers/teacher.handler';


const router = express.Router();

router.route('/')
  .get(getTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.route('/:id/students')
  .get(getTeacherStudents);

export default router;
