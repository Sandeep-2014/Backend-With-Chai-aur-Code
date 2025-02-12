import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
// import { application } from "express"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId) 
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })
    
      return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler( async(req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    // get user details from front-end
    // validation - not empty any field
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response  

    const {fullName, email, username, password} = req.body

    // console.log("email: ", email);
    // console.log("username: ", username);

    // below we are checking that is any field is empty or not if any field is empty so we will send an error message

    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    // below we are checking that is username or email are already exist in the data base or not 

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // console.log(req.files);
    // console.log("\n this line break of req.files and req.files.avatar[0]");
    
    // console.log(req.files.avatar[0]);
    
    // console.log("This is avatarLocalPath : ", avatarLocalPath);
    // console.log("This is coverImageLocalPath : ", coverImageLocalPath);
    

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("this is avatar output : ", avatar);
    

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
} )


const loginUser = asyncHandler( async(req, res) => {
    // take data from req.body
    // check username or email in our database.
    // if not a user in our database so will give message for register the user
    // if user in our database so we will check the password is password is correct or not 
    // if password is wrong we will not log in 
    // password is correct we will generate a access token and refresh token for that user 
    // send these token in the form of cookies
    // send response of success login 

    const {email, username, password} = req.body
    console.log(email)

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exists please register the user first")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!password){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // by default cookies ko hum front-end se modify kar pate hai lekin jab option ke through hum jab httpOlny or secure ko true kr dete hai to yeh sirf server pr hi modify ki ja sakti hai front-end se nahi hum cookies ko front-end pr sirf dekh sakte hai
    const options = {
        httpOnly: true,
        secure: true
    }

    console.log("accessToken: ", accessToken)
    console.log("refreshToken: ", refreshToken)
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged In successfully")
    )
} )


const logOutUser = asyncHandler(async(req, res) => {
    const data = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {
            new: true
        }
    )
    console.log("delter refresh token: ", data)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Succesfully"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken =  jwt.verify(refreshAccessToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}



// [Object: null prototype] {
//     avatar: [
//       {
//         fieldname: 'avatar',
//         originalname: 'IMG_20240915_120656.jpg',
//         encoding: '7bit',
//         mimetype: 'image/jpeg',
//         destination: './public/temp',
//         filename: 'IMG_20240915_120656.jpg',
//         path: 'public/temp/IMG_20240915_120656.jpg',
//         size: 8499846
//       }
//     ],
//     coverImage: [
//       {
//         fieldname: 'coverImage',
//         originalname: 'IMG_20240915_133402.jpg',
//         encoding: '7bit',
//         mimetype: 'image/jpeg',
//         destination: './public/temp',
//         filename: 'IMG_20240915_133402.jpg',
//         path: 'public/temp/IMG_20240915_133402.jpg',
//         size: 10185775
//       }
//     ]
//   }
  
//    this line break of req.files and req.files.avatar[0]
//   {
//     fieldname: 'avatar',
//     originalname: 'IMG_20240915_120656.jpg',
//     encoding: '7bit',
//     mimetype: 'image/jpeg',
//     destination: './public/temp',
//     filename: 'IMG_20240915_120656.jpg',
//     path: 'public/temp/IMG_20240915_120656.jpg',
//     size: 8499846
//   }