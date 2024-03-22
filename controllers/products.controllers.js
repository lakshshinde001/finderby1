import fs from 'fs/promises';
import path from 'path';

import cloudinary from 'cloudinary';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import Product from '../models/product.model.js';
import AppError from '../utils/AppError.js';

/**
 * @ALL_COURSES
 * @ROUTE @GET {{URL}}/api/v1/courses
 * @ACCESS Public
 */
export const getAllProducts = asyncHandler(async (_req, res, next) => {
  // Find all the courses without lectures
  const courses = await Product.find({}).select('-title');

  res.status(200).json({
    success: true,
    message: 'All Products',
    courses,
  });
});

/**
 * @CREATE_COURSE
 * @ROUTE @POST {{URL}}/api/v1/courses
 * @ACCESS Private (admin only)
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError('All fields are required', 400));
  }

  const product = await Product.create({
    title,
    description,
    category,
    createdBy,
  });

  if (!product) {
    return next(
      new AppError('Product could not be created, please try again', 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'products', // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        product.thumbnail.public_id = product.public_id;
        product.thumbnail.secure_url = product.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      for (const file of await fs.readdir('uploads/')) {
        await fs.unlink(path.join('uploads/', file));
      }

      // Send the error message
      return next(
        new AppError(
          JSON.stringify(error) || 'File not uploaded, please try again',
          400
        )
      );
    }
  }

  // Save the changes
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    course,
  });
});

/**
 * @GET_PRODUCTS_BY_COURSE_ID
 * @ROUTE @POST {{URL}}/api/v1/courses/:id
 * @ACCESS Private(ADMIN users only)
 */
export const getProductsByProductId = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new AppError('Invalid product id or course not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Products fetched successfully',
    title: product.title,
  });
});

// /**
//  * @ADD_PRODUCT
//  * @ROUTE @POST {{URL}}/api/v1/courses/:id
//  * @ACCESS Private (Admin Only)
//  */
// export const addLectureToCourseById = asyncHandler(async (req, res, next) => {
//   const { title, description } = req.body;
//   const { id } = req.params;

//   let lectureData = {};

//   if (!title || !description) {
//     return next(new AppError('Title and Description are required', 400));
//   }

//   const course = await Course.findById(id);

//   if (!course) {
//     return next(new AppError('Invalid course id or course not found.', 400));
//   }

//   // Run only if user sends a file
//   if (req.file) {
//     try {
//       const result = await cloudinary.v2.uploader.upload(req.file.path, {
//         folder: 'lms', // Save files in a folder named lms
//         chunk_size: 50000000, // 50 mb size
//         resource_type: 'video',
//       });

//       // If success
//       if (result) {
//         // Set the public_id and secure_url in array
//         lectureData.public_id = result.public_id;
//         lectureData.secure_url = result.secure_url;
//       }

//       // After successful upload remove the file from local storage
//       fs.rm(`uploads/${req.file.filename}`);
//     } catch (error) {
//       // Empty the uploads directory without deleting the uploads directory
//       for (const file of await fs.readdir('uploads/')) {
//         await fs.unlink(path.join('uploads/', file));
//       }

//       // Send the error message
//       return next(
//         new AppError(
//           JSON.stringify(error) || 'File not uploaded, please try again',
//           400
//         )
//       );
//     }
//   }

//   course.lectures.push({
//     title,
//     description,
//     // product: productData,
//   });

//   course.numberOfLectures = course.lectures.length;

//   // Save the course object
//   await course.save();

//   res.status(200).json({
//     success: true,
//     message: 'Course lecture added successfully',
//     course,
//   });
// });

// /**
//  * @remove_product
//  * @ROUTE @DELETE {{URL}}/api/v1/courses/:courseId/lectures/:lectureId
//  * @ACCESS Private (Admin only)
//  */
// export const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
//   // Grabbing the courseId and lectureId from req.query
//   const { courseId, lectureId } = req.query;

//   console.log(courseId);

//   // Checking if both courseId and lectureId are present
//   if (!courseId) {
//     return next(new AppError('Course ID is required', 400));
//   }

//   if (!lectureId) {
//     return next(new AppError('Lecture ID is required', 400));
//   }

//   // Find the course uding the courseId
//   const course = await Course.findById(courseId);

//   // If no course send custom message
//   if (!course) {
//     return next(new AppError('Invalid ID or Course does not exist.', 404));
//   }

//   // Find the index of the lecture using the lectureId
//   const lectureIndex = course.lectures.findIndex(
//     (lecture) => lecture._id.toString() === lectureId.toString()
//   );

//   // If returned index is -1 then send error as mentioned below
//   if (lectureIndex === -1) {
//     return next(new AppError('Lecture does not exist.', 404));
//   }

//   // Delete the lecture from cloudinary
//   await cloudinary.v2.uploader.destroy(
//     course.lectures[lectureIndex].lecture.public_id,
//     {
//       resource_type: 'video',
//     }
//   );

//   // Remove the lecture from the array
//   course.lectures.splice(lectureIndex, 1);

//   // update the number of lectures based on lectres array length
//   course.numberOfLectures = course.lectures.length;

//   // Save the course object
//   await course.save();

//   // Return response
//   res.status(200).json({
//     success: true,
//     message: 'Course lecture removed successfully',
//   });
// });

/**
 * @UPDATE_PRODUCT_BY_ID
 * @ROUTE @PUT {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */
export const updateProductById = asyncHandler(async (req, res, next) => {
  // Extracting the course id from the request params
  const { id } = req.params;

  // Finding the course using the course id
  const product = await Product.findByIdAndUpdate(
    id,
    {
      $set: req.body, // This will only update the fields which are present
    },
    {
      runValidators: true, // This will run the validation checks on the new data
    }
  );

  // If no course found then send the response for the same
  if (!product) {
    return next(new AppError('Invalid product id or product not found.', 400));
  }

  // Sending the response after success
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
  });
});

/**
 * @DELETE_PRODUCT_BY_ID
 * @ROUTE @DELETE {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */
export const deleteProductById = asyncHandler(async (req, res, next) => {
  // Extracting id from the request parameters
  const { id } = req.params;

  // Finding the course via the course ID
  const product = await Product.findById(id);

  // If course not find send the message as stated below
  if (!product) {
    return next(new AppError('Product with given id does not exist.', 404));
  }

  // Remove course
  await product.remove();

  // Send the message as response
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});
