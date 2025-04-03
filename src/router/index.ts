import bookRoutes from './book.routes'
import studentRoutes from './student.routes'
import teacherRoutes from './teacher.routes'
import { Router } from 'express'

const router = Router()


router.use('/books', bookRoutes)
router.use('/teachers', teacherRoutes)
router.use('/students', studentRoutes)


export default router