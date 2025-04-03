import Teacher from '../db/mongo/models/teacher';
import Student from '../db/mongo/models/student';
import Book from '../db/mongo/models/book';
import { redisClient } from '../db/redis/init';
import mongoose from 'mongoose';

const resolvers = {
  Query: {
    // Teacher Queries
    teachers: async () => {
      // Check cache first
      const cachedTeachers = await redisClient.get('all_teachers');
      if (cachedTeachers) {
        return JSON.parse(cachedTeachers);
      }

      // If not in cache, fetch from database
      const teachers = await Teacher.find();
      // Store in cache for 1 hour
      await redisClient.setex('all_teachers', 3600, JSON.stringify(teachers));
      return teachers;
    },
    teacher: async (_: any, { id }: { id: string }) => {
      // Check cache first
      const cachedTeacher = await redisClient.get(`teacher:${id}`);
      if (cachedTeacher) {
        return JSON.parse(cachedTeacher);
      }

      // If not in cache, fetch from database
      const teacher = await Teacher.findById(id);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      // Store in cache for 1 hour
      await redisClient.setex(`teacher:${id}`, 3600, JSON.stringify(teacher));
      return teacher;
    },

    // Student Queries
    students: async () => {
      // Check cache first
      const cachedStudents = await redisClient.get('all_students');
      if (cachedStudents) {
        return JSON.parse(cachedStudents);
      }

      // If not in cache, fetch from database
      const students = await Student.find();
      // Store in cache for 1 hour
      await redisClient.setex('all_students', 3600, JSON.stringify(students));
      return students;
    },
    student: async (_: any, { id }: { id: string }) => {
      // Check cache first
      const cachedStudent = await redisClient.get(`student:${id}`);
      if (cachedStudent) {
        return JSON.parse(cachedStudent);
      }

      // If not in cache, fetch from database
      const student = await Student.findById(id);
      if (!student) {
        throw new Error('Student not found');
      }
      // Store in cache for 1 hour
      await redisClient.setex(`student:${id}`, 3600, JSON.stringify(student));
      return student;
    },
    teacherStudents: async (_: any, { teacherId }: { teacherId: string }) => {
      // Check cache first
      const cachedStudents = await redisClient.get(`teacher:${teacherId}:students`);
      if (cachedStudents) {
        return JSON.parse(cachedStudents);
      }

      // If not in cache, fetch from database
      const students = await Student.find({ teacher: teacherId });
      // Store in cache for 1 hour
      await redisClient.setex(`teacher:${teacherId}:students`, 3600, JSON.stringify(students));
      return students;
    },

    // Book Queries
    books: async () => {
      // Check cache first
      const cachedBooks = await redisClient.get('all_books');
      if (cachedBooks) {
        return JSON.parse(cachedBooks);
      }

      // If not in cache, fetch from database
      const books = await Book.find();
      // Store in cache for 1 hour
      await redisClient.setex('all_books', 3600, JSON.stringify(books));
      return books;
    },
    book: async (_: any, { id }: { id: string }) => {
      // Check cache first
      const cachedBook = await redisClient.get(`book:${id}`);
      if (cachedBook) {
        return JSON.parse(cachedBook);
      }

      // If not in cache, fetch from database
      const book = await Book.findById(id);
      if (!book) {
        throw new Error('Book not found');
      }
      // Store in cache for 1 hour
      await redisClient.setex(`book:${id}`, 3600, JSON.stringify(book));
      return book;
    },
    studentBooks: async (_: any, { studentId }: { studentId: string }) => {
      // Check cache first
      const cachedBooks = await redisClient.get(`student:${studentId}:books`);
      if (cachedBooks) {
        return JSON.parse(cachedBooks);
      }

      // If not in cache, fetch from database
      const student = await Student.findById(studentId).populate('books');
      if (!student) {
        throw new Error('Student not found');
      }
      // Store in cache for 1 hour
      await redisClient.setex(`student:${studentId}:books`, 3600, JSON.stringify(student.books));
      return student.books;
    },
  },

  Mutation: {
    // Teacher Mutations
    createTeacher: async (_: any, { input }: { input: any }) => {
      const teacher = await Teacher.create(input);
      // Invalidate cache
      await redisClient.del('all_teachers');
      return teacher;
    },
    updateTeacher: async (_: any, { id, input }: { id: string; input: any }) => {
      const teacher = await Teacher.findByIdAndUpdate(id, input, { new: true });
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      // Invalidate caches
      await redisClient.del(`teacher:${id}`);
      await redisClient.del('all_teachers');
      return teacher;
    },
    deleteTeacher: async (_: any, { id }: { id: string }) => {
      const teacher = await Teacher.findByIdAndDelete(id);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      // Invalidate caches
      await redisClient.del(`teacher:${id}`);
      await redisClient.del('all_teachers');
      return teacher;
    },

    // Student Mutations
    createStudent: async (_: any, { input }: { input: any }) => {
      const { teacherId, ...studentData } = input;
      
      // Validate teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      // Create student
      const student = await Student.create({
        ...studentData,
        teacher: teacherId,
      });
      
      // Update teacher's students array
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: { students: student._id },
      });
      
      // Invalidate caches
      await redisClient.del('all_students');
      await redisClient.del(`teacher:${teacherId}`);
      await redisClient.del(`teacher:${teacherId}:students`);
      
      return student;
    },
    updateStudent: async (_: any, { id, input }: { id: string; input: any }) => {
      const { teacherId, ...studentData } = input;
      
      // Get current student data for cache invalidation
      const currentStudent = await Student.findById(id);
      if (!currentStudent) {
        throw new Error('Student not found');
      }
      
      // If teacher is being changed
      if (teacherId && !currentStudent.teacher.equals(new mongoose.Types.ObjectId(teacherId))) {
        // Remove student from old teacher
        await Teacher.findByIdAndUpdate(currentStudent.teacher, {
          $pull: { students: id },
        });
        
        // Add student to new teacher
        await Teacher.findByIdAndUpdate(teacherId, {
          $push: { students: id },
        });
        
        // Invalidate old teacher cache
        await redisClient.del(`teacher:${currentStudent.teacher}`);
        await redisClient.del(`teacher:${currentStudent.teacher}:students`);
      }
      
      // Update student
      const student = await Student.findByIdAndUpdate(
        id,
        { ...studentData, teacher: teacherId || currentStudent.teacher },
        { new: true }
      );
      
      // Invalidate caches
      await redisClient.del(`student:${id}`);
      await redisClient.del('all_students');
      if (teacherId) {
        await redisClient.del(`teacher:${teacherId}`);
        await redisClient.del(`teacher:${teacherId}:students`);
      }
      
      return student;
    },
    deleteStudent: async (_: any, { id }: { id: string }) => {
      const student = await Student.findById(id);
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Remove student from teacher
      await Teacher.findByIdAndUpdate(student.teacher, {
        $pull: { students: id },
      });
      
      // Remove student from books borrowedBy
      await Book.updateMany(
        { borrowedBy: id },
        { $pull: { borrowedBy: id } }
      );
      
      // Delete student
      await Student.findByIdAndDelete(id);
      
      // Invalidate caches
      await redisClient.del(`student:${id}`);
      await redisClient.del('all_students');
      await redisClient.del(`teacher:${student.teacher}`);
      await redisClient.del(`teacher:${student.teacher}:students`);
      await redisClient.del(`student:${id}:books`);
      
      return student;
    },

    // Book Mutations
    createBook: async (_: any, { input }: { input: any }) => {
      const book = await Book.create(input);
      // Invalidate cache
      await redisClient.del('all_books');
      return book;
    },
    updateBook: async (_: any, { id, input }: { id: string; input: any }) => {
      const book = await Book.findByIdAndUpdate(id, input, { new: true });
      if (!book) {
        throw new Error('Book not found');
      }
      // Invalidate caches
      await redisClient.del(`book:${id}`);
      await redisClient.del('all_books');
      // If book is borrowed by students, invalidate their book caches
      if (book.borrowedBy && book.borrowedBy.length > 0) {
        for (const studentId of book.borrowedBy) {
          await redisClient.del(`student:${studentId}:books`);
        }
      }
      return book;
    },
    deleteBook: async (_: any, { id }: { id: string }) => {
      const book = await Book.findById(id);
      if (!book) {
        throw new Error('Book not found');
      }
      
      // Remove book from students' books arrays
      if (book.borrowedBy && book.borrowedBy.length > 0) {
        for (const studentId of book.borrowedBy) {
          await Student.findByIdAndUpdate(studentId, {
            $pull: { books: id },
          });
          await redisClient.del(`student:${studentId}:books`);
        }
      }
      
      // Delete book
      await Book.findByIdAndDelete(id);
      
      // Invalidate caches
      await redisClient.del(`book:${id}`);
      await redisClient.del('all_books');
      
      return book;
    },
    
    // Book Borrowing Mutations
    borrowBook: async (_: any, { bookId, studentId }: { bookId: string; studentId: string }) => {
      // Find the book and student
      const book = await Book.findById(bookId);
      const student = await Student.findById(studentId);
      
      if (!book) {
        throw new Error('Book not found');
      }
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Check if book is available
      if (book.quantity <= 0) {
        throw new Error('Book is not available for borrowing');
      }
      
      // Check if student already borrowed this book
      if (book.borrowedBy?.some(id => id.equals(new mongoose.Types.ObjectId(studentId)))) {
        throw new Error('Student already borrowed this book');
      }
      
      // Update book
      book.quantity -= 1;
      book.borrowedBy = [...(book.borrowedBy || []), new mongoose.Types.ObjectId(studentId)];
      await book.save();
      
      // Update student
      await Student.findByIdAndUpdate(studentId, {
        $push: { books: bookId },
      });
      
      // Invalidate caches
      await redisClient.del(`book:${bookId}`);
      await redisClient.del(`student:${studentId}`);
      await redisClient.del(`student:${studentId}:books`);
      await redisClient.del('all_books');
      
      return book;
    },
    returnBook: async (_: any, { bookId, studentId }: { bookId: string; studentId: string }) => {
      // Find the book and student
      const book = await Book.findById(bookId);
      const student = await Student.findById(studentId);
      
      if (!book) {
        throw new Error('Book not found');
      }
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Check if student borrowed this book
      if (!book.borrowedBy?.some(id => id.equals(new mongoose.Types.ObjectId(studentId)))) {
        throw new Error('Student did not borrow this book');
      }
      
      // Update book
      book.quantity += 1;
      book.borrowedBy = book.borrowedBy.filter(
        id => !id.equals(new mongoose.Types.ObjectId(studentId))
      );
      await book.save();
      
      // Update student
      await Student.findByIdAndUpdate(studentId, {
        $pull: { books: bookId },
      });
      
      // Invalidate caches
      await redisClient.del(`book:${bookId}`);
      await redisClient.del(`student:${studentId}`);
      await redisClient.del(`student:${studentId}:books`);
      await redisClient.del('all_books');
      
      return book;
    },
  },

  // Field resolvers to handle relationships
  Teacher: {
    students: async (parent: any) => {
      return Student.find({ _id: { $in: parent.students } });
    },
  },
  Student: {
    teacher: async (parent: any) => {
      return Teacher.findById(parent.teacher);
    },
    books: async (parent: any) => {
      return Book.find({ _id: { $in: parent.books } });
    },
  },
  Book: {
    borrowedBy: async (parent: any) => {
      if (!parent.borrowedBy || parent.borrowedBy.length === 0) {
        return [];
      }
      return Student.find({ _id: { $in: parent.borrowedBy } });
    },
  },
};

export default resolvers;
