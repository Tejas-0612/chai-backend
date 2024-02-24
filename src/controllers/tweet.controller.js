import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if(!content){
        throw ApiError(400,"is missing")
    }
    const tweet=await Tweet.create({
        content,
        owner:req.user._id
    }
    )
    if(!tweet){
        throw ApiError(500,"db issue")
    }

    return res.status(200).json(new ApiResponse(200,tweet,"created tweet sucessfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    console.log(req.params)
    const {userId}=req.params;
    console.log(userId)
    if(!userId){
        throw ApiError(400,"userId is missing")
    }

    const userTweets=await Tweet.find(
        {owner:userId}
    ).select("-owner");

    console.log(userTweets);

    if(!userTweets){
        throw new ApiError(400,"user has no tweets");
    }

    return res.status(200).json(
        new ApiResponse(200,userId,"Fetched tweets successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params;
    const {content}=req.body;

    if(!(tweetId && content)){
        throw new ApiError(200,"tweet Id or content is missing to update")
    };

    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{content:content}
        },{new:true}
    )
   
        console.log(updatedTweet)
    if(!updatedTweet){
        throw new ApiError(500,"DB error")
    }

    return res.status(200).json(
        new ApiResponse(200,updatedTweet,"Updated sucessfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params

    if(!tweetId){
        throw new ApiError(400,"tweetId is missing")
    };

    const deleteTweet=await Tweet.findByIdAndDelete(tweetId);

    if(!deleteTweet){
        throw new ApiError(400,"deleted tweet failed")
    }

    return res.status(200).json(
        new ApiResponse(200,"Successfully deleted the tweet")
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}