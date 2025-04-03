import express from 'express';
import {
  getStudents,
  getStudent,
  getStudentBooks,
  createStudent,
  updateStudent,
  deleteStudent,
  assignBook,
  returnBook,
} from '../handlers/student.handler';


const router = express.Router();

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

router.route('/:id/books')
  .get(getStudentBooks);

router.route('/:id/books/:bookId')
  .post(assignBook)
  .delete(returnBook);

export default router;
