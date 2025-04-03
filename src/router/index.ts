import bookRoutes from './book.routes'
import studentrRoutes from './student.routes'
import teacherRoutes from './teacher.routes'
import { Router } from 'express'

const router = Router()


router.use('/books', bookRoutes)
router.use('/teachers', teacherRoutes)


export default router