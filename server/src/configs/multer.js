// config/multer.js
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Mangament", // tên folder trên cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      return `${Date.now()}-${file.originalname}`;
    },
  },
});

const uploadMulter = multer({ storage });

export default uploadMulter;
