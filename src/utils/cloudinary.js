import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({

  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET

});

const UploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload the file on the cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("FIle is uploaded on cloudinary ",response.url);
        return response;
    } catch (error) {
        fs.unlink(localFilePath);
        return null;
    }
}

export {UploadOnCloudinary}