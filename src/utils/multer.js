import multer from 'multer';

// Configure multer for memory storage (no file saving)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 250 * 1024 * 1024 // 250MB limit
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImage', maxCount: 20 },
    { name: 'images', maxCount: 20 },
    { name: 'event_img', maxCount: 1 }
]);

// Configure multer for multiple image fields
const uploadImages = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 250 * 1024 * 1024 // 250MB limit
    }
}).fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'sub_images', maxCount: 10 },
    { name: 'menuImages', maxCount: 10 },
]);

export { upload, uploadImages };

