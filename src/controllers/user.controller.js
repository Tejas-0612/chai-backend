import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefreshTokens=async(userId)=>{

    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        
    
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating referesh and access token")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
   
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from <response></response>
    // check for user creation
    // return res

    const {fullName,email,username,password}=req.body;

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
   
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullName,
        email,
        password,
        username:username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })

    const createdUser=await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    //Get user data from req body
    //checking username or email
    //finding the user in the db
    //checking the password
    //access & refresh tokens
    //sending cookies as a res

    const {username,email,password}=req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required!")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    
    const loggedInUser=await User.findById(user._id).select("-passsword -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user:loggedInUser,accessToken,refreshToken
                    },
                    "User logged In successfully"
                )
            )

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    ) 

    const options={
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged Out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}