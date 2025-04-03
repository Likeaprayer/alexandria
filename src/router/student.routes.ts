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
import { cacheMiddleware } from '../middleware/cache-middleware';


const router = express.Router();

router.route('/')
  .get(cacheMiddleware(), getStudents)
  .post(createStudent);

router.route('/:id')
  .get(cacheMiddleware(), getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

router.route('/:id/books')
  .get(cacheMiddleware(), getStudentBooks);

router.route('/:id/books/:bookId')
  .post(assignBook)
  .delete(returnBook);

export default router;
