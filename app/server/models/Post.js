import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true, // Index for quick user lookups
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    activity: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // URL to image
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String], // Array of UIDs who liked the post
      default: [],
    },
    comments: [
      {
        uid: String,
        username: String,
        text: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Geospatial index for proximity queries
postSchema.index({ location: "2dsphere" });

const Post = mongoose.model("Post", postSchema);
export default Post;
