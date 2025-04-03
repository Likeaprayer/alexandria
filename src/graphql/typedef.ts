import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Teacher {
    id: ID!
    name: String!
    email: String!
    subject: String!
    students: [Student]
    createdAt: String
    updatedAt: String
  }

  type Student {
    id: ID!
    name: String!
    email: String!
    grade: String!
    teacher: Teacher!
    books: [Book]
    createdAt: String
    updatedAt: String
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    isbn: String!
    publishedYear: Int!
    genre: String!
    quantity: Int!
    borrowedBy: [Student]
    createdAt: String
    updatedAt: String
  }

  type Query {
    teachers: [Teacher]
    teacher(id: ID!): Teacher
    students: [Student]
    student(id: ID!): Student
    teacherStudents(teacherId: ID!): [Student]
    books: [Book]
    book(id: ID!): Book
    studentBooks(studentId: ID!): [Book]
  }

  input TeacherInput {
    name: String!
    email: String!
    subject: String!
  }

  input StudentInput {
    name: String!
    email: String!
    grade: String!
    teacherId: ID!
  }

  input BookInput {
    title: String!
    author: String!
    isbn: String!
    publishedYear: Int!
    genre: String!
    quantity: Int!
  }

  type Mutation {
    createTeacher(input: TeacherInput!): Teacher
    updateTeacher(id: ID!, input: TeacherInput!): Teacher
    deleteTeacher(id: ID!): Teacher
    
    createStudent(input: StudentInput!): Student
    updateStudent(id: ID!, input: StudentInput!): Student
    deleteStudent(id: ID!): Student
    
    createBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookInput!): Book
    deleteBook(id: ID!): Book
    
    borrowBook(bookId: ID!, studentId: ID!): Book
    returnBook(bookId: ID!, studentId: ID!): Book
  }
`;

export default typeDefs;
