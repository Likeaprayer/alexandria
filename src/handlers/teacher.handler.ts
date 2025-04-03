import { Request, Response } from 'express';
import Student from '../db/mongo/models/student';
import Teacher from '../db/mongo/models/teacher';
import Book from '../db/mongo/models/book';
import { redisClient } from '../db/redis/init';

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
export const getTeachers = async (_req: Request, res: Response): Promise<any> => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Public
export const getTeacher = async (req: Request, res: Response): Promise<any> => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    res.status(200).json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students of a teacher
// @route   GET /api/teachers/:id/students
// @access  Public
export const getTeacherStudents = async (req: Request, res: Response): Promise<any> => {
  try {
    const students = await Student.find({ teacher: req.params.id });
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Public
export const createTeacher = async (req: Request, res: Response): Promise<any> => {
  try {
    const teacher = await Teacher.create(req.body);
    
    // Invalidate cache
    await redisClient.del('express:/api/teachers');
    
    res.status(201).json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Public
export const updateTeacher = async (req: Request, res: Response): Promise<any> => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Invalidate caches
    await redisClient.del(`express:/api/teachers/${req.params.id}`);
    await redisClient.del('express:/api/teachers');
    await redisClient.del(`express:/api/teachers/${req.params.id}/students`);
    
    res.status(200).json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Public
export const deleteTeacher = async (req: Request, res: Response): Promise<any> => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Update students to remove this teacher
    await Student.updateMany(
      { teacher: req.params.id },
      { $unset: { teacher: 1 } }
    );
    
    await teacher.deleteOne();
    
    // Invalidate caches
    await redisClient.del(`express:/api/teachers/${req.params.id}`);
    await redisClient.del('express:/api/teachers');
    await redisClient.del(`express:/api/teachers/${req.params.id}/students`);
    
    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
