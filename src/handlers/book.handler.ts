import { Request, Response } from 'express';
import Book from '../db/mongo/models/book';
import Student from '../db/mongo/models/student';
import { redisClient } from '../db/redis/init';

// @desc    Get all books
// @route   GET /api/books
// @access  Public
export const getBooks = async (_req: Request, res: Response) => {
  try {
    const books = await Book.find();
    res.status(200).json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
export const getBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.status(200).json({ success: true, data: book });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Public
export const createBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.create(req.body);
    
    // Invalidate cache
    await redisClient.del('express:/api/books');
    
    res.status(201).json({ success: true, data: book });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Public
export const updateBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Invalidate caches
    await redisClient.del(`express:/api/books/${req.params.id}`);
    await redisClient.del('express:/api/books');
    
    // If book is borrowed by students, invalidate their book caches
    if (book.borrowedBy && book.borrowedBy.length > 0) {
      for (const studentId of book.borrowedBy) {
        await redisClient.del(`express:/api/students/${studentId}/books`);
      }
    }
    
    res.status(200).json({ success: true, data: book });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Public
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Remove book from students who have borrowed it
    if (book.borrowedBy && book.borrowedBy.length > 0) {
      await Student.updateMany(
        { _id: { $in: book.borrowedBy } },
        { $pull: { books: req.params.id } }
      );
      
      // Invalidate student book caches
      for (const studentId of book.borrowedBy) {
        await redisClient.del(`express:/api/students/${studentId}/books`);
        await redisClient.del(`express:/api/students/${studentId}`);
      }
    }
    
    await book.deleteOne();
    
    // Invalidate book caches
    await redisClient.del(`express:/api/books/${req.params.id}`);
    await redisClient.del('express:/api/books');
    
    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
