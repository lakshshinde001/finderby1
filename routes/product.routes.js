import { Router } from 'express';
import {
  // addLectureToCourseById,
  createProduct,
  deleteProductById,
  getAllProducts,
  getProductsByProductId,
  // removeLectureFromCourse,
  updateProductById,
} from '../controllers/products.controllers.js';
import {
  authorizeRoles,
  authorizeSubscribers,
  isLoggedIn,
} from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

// , isLoggedIn, authorizeRoles("ADMIN", "USER") - middlewares

// OLD Code
// router.get("/", getAllCourses);
// router.post("/", isLoggedIn, authorizeRoles("ADMIN"), createCourse);
// router.delete(
//   "/",
//   isLoggedIn,
//   authorizeRoles("ADMIN"),
//   removeLectureFromCourse
// );
// router.get("/:id", isLoggedIn, getLecturesByCourseId);
// router.post(
//   "/:id",
//   isLoggedIn,
//   authorizeRoles("ADMIN"),
//   upload.single("lecture"),
//   addLectureToCourseById
// );
// router.delete("/:id", isLoggedIn, authorizeRoles("ADMIN"), deleteCourseById);

// Refactored code
router
  .route('/')
  .get(getAllProducts)
  .post(
    isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('thumbnail'),
    createProduct
  )
  .delete(isLoggedIn, authorizeRoles('ADMIN'), deleteProductById);

router
  .route('/:id')
  .get(isLoggedIn, authorizeSubscribers, getProductsByProductId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
  // .post(
  //   isLoggedIn,
  //   authorizeRoles('ADMIN'),
  //   upload.single('product'),
  //   addLectureToCourseById
  // )
  .put(isLoggedIn, authorizeRoles('ADMIN'), updateProductById);

export default router;
