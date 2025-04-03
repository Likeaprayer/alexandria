# alexandria | Library Management application

A comprehensive School Management System with both GraphQL and RESTful APIs for managing teachers, students, and books. This system includes caching for improved performance.

## Technologies Used

- Node.js
- TypeScript
- Express.js (REST API)
- Apollo Server (GraphQL API)
- MongoDB with Mongoose
- Redis for caching

## Features

- **GraphQL API** for efficient data fetching
- **RESTful API** for traditional HTTP operations
- **Database Integration** with MongoDB
- **Caching** with Redis for improved performance
- **Complete CRUD operations** for Teachers, Students, and Books
- **Relationship management** between entities

## Getting Started

### Prerequisites

Docker (recommended)

or

- Node.js (v14+)
- MongoDB
- Redis


### Installation

1. Clone the repository
```bash
git clone https://github.com/Likeaprayer/alexandria.git
cd alexandria
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following content:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/alexan-db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
NODE_ENV=development
```

4. Build the project
```bash
npm run build
```

5. Start the server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### REST API

#### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get a single teacher by ID
- `GET /api/teachers/:id/students` - Get all students of a teacher
- `POST /api/teachers` - Create a new teacher
- `PUT /api/teachers/:id` - Update a teacher
- `DELETE /api/teachers/:id` - Delete a teacher

#### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get a single student by ID
- `GET /api/students/:id/books` - Get all books of a student
- `POST /api/students` - Create a new student
- `PUT /api/students/:id` - Update a student
- `DELETE /api/students/:id` - Delete a student
- `POST /api/students/:id/books/:bookId` - Assign a book to a student
- `DELETE /api/students/:id/books/:bookId` - Return a book from a student

#### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get a single book by ID
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

### GraphQL API

GraphQL endpoint: `/graphql`

#### Queries:
- `teachers` - Get all teachers
- `teacher(id: ID!)` - Get a teacher by ID
- `students` - Get all students
- `student(id: ID!)` - Get a student by ID
- `teacherStudents(teacherId: ID!)` - Get all students of a teacher
- `books` - Get all books
- `book(id: ID!)` - Get a book by ID
- `studentBooks(studentId: ID!)` - Get all books of a student

#### Mutations:
- Create, update, delete operations for teachers, students, and books
- Book borrowing and returning functionality
