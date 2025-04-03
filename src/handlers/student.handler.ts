import { Request, Response } from 'express';
import Student from '../db/mongo/models/student';
import Teacher from '../db/mongo/models/teacher';
import Book from '../db/mongo/models/book';
import { redisClient } from '../db/redis/init';
import mongoose from 'mongoose';

// @desc    Get all students
// @route   GET /api/students
// @access  Public
export const getStudents = async (_req: Request, res: Response): Promise<any> => {
  try {
    const students = await Student.find();
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Public
export const getStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all books of a student
// @route   GET /api/students/:id/books
// @access  Public
export const getStudentBooks = async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id).populate('books');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student.books });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Public
export const createStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { teacherId, ...studentData } = req.body;
    
    // Validate teacher exists if provided
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }
    
    // Create student
    const student = await Student.create({
      ...studentData,
      teacher: teacherId,
    });
    
    // Update teacher's students array
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: { students: student._id },
      });
      
      // Invalidate teacher caches
      await redisClient.del(`express:/api/teachers/${teacherId}`);
      await redisClient.del(`express:/api/teachers/${teacherId}/students`);
    }
    
    // Invalidate student caches
    await redisClient.del('express:/api/students');
    
    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Public
export const updateStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { teacherId, ...studentData } = req.body;
    
    // Get current student data
    const currentStudent = await Student.findById(req.params.id);
    if (!currentStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // If teacher is being changed
    if (teacherId && !currentStudent.teacher.equals(new mongoose.Types.ObjectId(teacherId))) {
      // Validate new teacher exists
      const newTeacher = await Teacher.findById(teacherId);
      if (!newTeacher) {
        return res.status(404).json({ success: false, message: 'New teacher not found' });
      }
      
      // Remove student from old teacher
      await Teacher.findByIdAndUpdate(currentStudent.teacher, {
        $pull: { students: req.params.id },
      });
      
      // Add student to new teacher
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: { students: req.params.id },
      });
      
      // Invalidate old teacher cache
      await redisClient.del(`express:/api/teachers/${currentStudent.teacher}`);
      await redisClient.del(`express:/api/teachers/${currentStudent.teacher}/students`);
      
      // Invalidate new teacher cache
      await redisClient.del(`express:/api/teachers/${teacherId}`);
      await redisClient.del(`express:/api/teachers/${teacherId}/students`);
    }
    
    // Update student
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { ...studentData, teacher: teacherId || currentStudent.teacher },
      { new: true, runValidators: true }
    );
    
    // Invalidate student caches
    await redisClient.del(`express:/api/students/${req.params.id}`);
    await redisClient.del('express:/api/students');
    await redisClient.del(`express:/api/students/${req.params.id}/books`);
    
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Public
export const deleteStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Remove student from teacher
    if (student.teacher) {
      await Teacher.findByIdAndUpdate(student.teacher, {
        $pull: { students: req.params.id },
      });
      
      // Invalidate teacher caches
      await redisClient.del(`express:/api/teachers/${student.teacher}`);
      await redisClient.del(`express:/api/teachers/${student.teacher}/students`);
    }
    
    // Remove student from books borrowedBy
    await Book.updateMany(
      { borrowedBy: req.params.id },
      { $pull: { borrowedBy: req.params.id } }
    );
    
    await student.deleteOne();
    
    // Invalidate student caches
    await redisClient.del(`express:/api/students/${req.params.id}`);
    await redisClient.del('express:/api/students');
    await redisClient.del(`express:/api/students/${req.params.id}/books`);
    
    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign book to student
// @route   POST /api/students/:id/books/:bookId
// @access  Public
export const assignBook = async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id);
    const book = await Book.findById(req.params.bookId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Check if book is available
    if (book.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Book is not available for borrowing' });
    }
    
    // Check if student already has this book
    if (student.books.includes(new mongoose.Types.ObjectId(req.params.bookId))) {
      return res.status(400).json({ success: false, message: 'Student already has this book' });
    }
    
    // Update book
    book.quantity -= 1;
    book.borrowedBy = [...(book.borrowedBy || []), new mongoose.Types.ObjectId(req.params.id)];
    await book.save();
    
    // Update student
    student.books.push(new mongoose.Types.ObjectId(req.params.bookId));
    await student.save();
    
    // Invalidate caches
    await redisClient.del(`express:/api/books/${req.params.bookId}`);
    await redisClient.del(`express:/api/students/${req.params.id}`);
    await redisClient.del(`express:/api/students/${req.params.id}/books`);
    
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Return book from student
// @route   DELETE /api/students/:id/books/:bookId
// @access  Public
export const returnBook = async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id);
    const book = await Book.findById(req.params.bookId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Check if student has this book
    if (!student.books.includes(new mongoose.Types.ObjectId(req.params.bookId))) {
      return res.status(400).json({ success: false, message: 'Student does not have this book' });
    }
    
    // Update book
    book.quantity += 1;
    book.borrowedBy = (book.borrowedBy || []).filter(
      id => !id.equals(new mongoose.Types.ObjectId(req.params.id))
    );
    await book.save();
    
    // Update student
    student.books = student.books.filter(
      id => !id.equals(new mongoose.Types.ObjectId(req.params.bookId))
    );
    await student.save();
    
    // Invalidate caches
    await redisClient.del(`express:/api/books/${req.params.bookId}`);
    await redisClient.del(`express:/api/students/${req.params.id}`);
    await redisClient.del(`express:/api/students/${req.params.id}/books`);
    
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
