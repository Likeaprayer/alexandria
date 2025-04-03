import express from 'express';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from '../handlers/book.handler';
import { cacheMiddleware } from '../middleware/cache-middleware';


const router = express.Router();

router.route('/')
  .get(cacheMiddleware(), getBooks)
  .post(createBook);

router.route('/:id')
  .get(cacheMiddleware(), getBook)
  .put(updateBook)
  .delete(deleteBook);

export default router;
