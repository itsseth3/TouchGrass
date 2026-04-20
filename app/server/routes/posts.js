import express from "express";
import Post from "../models/Post.js";
import { catchAsyncErrors } from "../utils/errors.js";

const router = express.Router();

// GET all posts
router.get(
  "/",
  catchAsyncErrors(async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  })
);

// GET posts by user UID (must come before /:postId to avoid route conflicts)
router.get(
  "/user/:uid",
  catchAsyncErrors(async (req, res) => {
    const posts = await Post.find({ uid: req.params.uid }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  })
);

// GET single post by ID
router.get(
  "/:postId",
  catchAsyncErrors(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  })
);

// CREATE a new post
router.post(
  "/",
  catchAsyncErrors(async (req, res) => {
    const { uid, title, content, location, activity, image, visibility } =
      req.body;

    if (!uid || !title || !content || !location) {
      return res.status(400).json({
        message: "Missing required fields: uid, title, content, location",
      });
    }

    const post = new Post({
      uid,
      title,
      content,
      location,
      activity,
      image,
      visibility,
    });

    await post.save();
    res.status(201).json(post);
  })
);

// UPDATE a post
router.patch(
  "/:postId",
  catchAsyncErrors(async (req, res) => {
    const { title, content, location, activity, image, visibility } = req.body;

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: {
          title,
          content,
          location,
          activity,
          image,
          visibility,
          updatedAt: Date.now(),
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  })
);

// DELETE a post
router.delete(
  "/:postId",
  catchAsyncErrors(async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  })
);

// LIKE a post
router.patch(
  "/:postId/like",
  catchAsyncErrors(async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: "User UID is required" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $addToSet: { likedBy: uid },
        $inc: { likes: 1 },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  })
);

// UNLIKE a post
router.patch(
  "/:postId/unlike",
  catchAsyncErrors(async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: "User UID is required" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $pull: { likedBy: uid },
        $inc: { likes: -1 },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  })
);

// ADD a comment
router.patch(
  "/:postId/comment",
  catchAsyncErrors(async (req, res) => {
    const { uid, username, text } = req.body;
    if (!uid || !text) {
      return res
        .status(400)
        .json({ message: "User UID and comment text are required" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $push: {
          comments: {
            uid,
            username,
            text,
            timestamp: Date.now(),
          },
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  })
);

// DELETE a comment
router.patch(
  "/:postId/comment/:commentId",
  catchAsyncErrors(async (req, res) => {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $pull: {
          comments: {
            _id: req.params.commentId,
          },
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  })
);

// GET posts near location (within radius)
router.post(
  "/search/nearby",
  catchAsyncErrors(async (req, res) => {
    const { coordinates, maxDistance = 5000 } = req.body; // maxDistance in meters

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        message: "Coordinates array [longitude, latitude] is required",
      });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
    }).sort({ createdAt: -1 });

    res.status(200).json(posts);
  })
);

export default router;
