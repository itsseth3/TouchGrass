import express from "express";
import User from "../models/User.js";
import handleDBError from "../utils/errors.js";


const router = express.Router();

// SPECIAL ROUTES (must come before :uid routes)

// Get all users (for finding friends)
router.get("/search/all/users", async (req, res) => {
    try {
        const users = await User.find({}, { uid: 1, email: 1, firstName: 1, lastName: 1, location: 1 });
        res.status(200).json(users);
    } catch (err) {
        handleDBError(res, err);
    }
});

// UID-BASED ROUTES

//get user by uid
router.get("/:uid", async (req, res) => {
    try{
        const user = await User.findOne({uid: req.params.uid});
        res.json(user);
    } catch(err){
        handleDBError(res, err);
    }
    
});

//get all users (generic)
router.get("/", async (req, res) => {
    try{
        const user = await User.find();
        res.json(user);
    } catch(err){
        handleDBError(res, err);
    }
    
});

//post (create user)
router.post("/", async (req, res) => {
     try{
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch(err){
       handleDBError(res, err);
    }
});

//patch (update user)
router.patch("/:uid", async (req, res) => {
     try{
        const updatedUser = await User.findOneAndUpdate(
            {uid: req.params.uid},
            {$set: req.body},
            {new: true} //get updated document instead of original
        );

        res.status(200).json(updatedUser);
    } catch(err){
        handleDBError(res, err);
    }
});


//delete user
router.delete("/:uid", async(req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete(
            {uid: req.params.uid}
        );
        if(!deletedUser){return res.status(404).json({message: "User not found."});}
        res.status(200).json(deletedUser);
        
    } catch (err) {
        handleDBError(res, err);
    }
});

// FRIEND REQUEST ROUTES
<<<<<<< HEAD
=======

// Send friend request
router.post("/:uid/friend-requests/:targetUid", async (req, res) => {
    try {
        const { uid, targetUid } = req.params;

        if (uid === targetUid) {
            return res.status(400).json({ message: "Cannot send friend request to yourself" });
        }

        const user = await User.findOne({ uid });
        const targetUser = await User.findOne({ uid: targetUid });

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (user.friends.includes(targetUid)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check if request already pending
        const existingRequest = targetUser.friendRequests.incoming.find(
            (req) => req.uid === uid && req.status === "pending"
        );
        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Add incoming request to target user
        targetUser.friendRequests.incoming.push({ uid, status: "pending" });
        await targetUser.save();

        // Add outgoing request to sender
        user.friendRequests.outgoing.push({ uid: targetUid, status: "pending" });
        await user.save();

        res.status(200).json({ message: "Friend request sent" });
    } catch (err) {
        handleDBError(res, err);
    }
});

// Accept friend request
router.patch("/:uid/friend-requests/:senderUid/accept", async (req, res) => {
    try {
        const { uid, senderUid } = req.params;

        const user = await User.findOne({ uid });
        const senderUser = await User.findOne({ uid: senderUid });

        if (!user || !senderUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find and remove incoming request
        user.friendRequests.incoming = user.friendRequests.incoming.filter(
            (req) => req.uid !== senderUid
        );

        // Find and remove outgoing request from sender
        senderUser.friendRequests.outgoing = senderUser.friendRequests.outgoing.filter(
            (req) => req.uid !== uid
        );

        // Add to friends list
        if (!user.friends.includes(senderUid)) {
            user.friends.push(senderUid);
        }
        if (!senderUser.friends.includes(uid)) {
            senderUser.friends.push(uid);
        }

        await user.save();
        await senderUser.save();

        res.status(200).json({ message: "Friend request accepted" });
    } catch (err) {
        handleDBError(res, err);
    }
});

// Decline friend request
router.patch("/:uid/friend-requests/:senderUid/decline", async (req, res) => {
    try {
        const { uid, senderUid } = req.params;

        const user = await User.findOne({ uid });
        const senderUser = await User.findOne({ uid: senderUid });

        if (!user || !senderUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove incoming request
        user.friendRequests.incoming = user.friendRequests.incoming.filter(
            (req) => req.uid !== senderUid
        );

        // Remove outgoing request from sender
        senderUser.friendRequests.outgoing = senderUser.friendRequests.outgoing.filter(
            (req) => req.uid !== uid
        );

        await user.save();
        await senderUser.save();

        res.status(200).json({ message: "Friend request declined" });
    } catch (err) {
        handleDBError(res, err);
    }
});

export default router;
>>>>>>> d7aa19e22e746b956cdecc129c85b0aae46d3576

// Send friend request
router.post("/:uid/friend-requests/:targetUid", async (req, res) => {
    try {
        const { uid, targetUid } = req.params;

        if (uid === targetUid) {
            return res.status(400).json({ message: "Cannot send friend request to yourself" });
        }

        const user = await User.findOne({ uid });
        const targetUser = await User.findOne({ uid: targetUid });

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (user.friends.includes(targetUid)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check if request already pending
        const existingRequest = targetUser.friendRequests.incoming.find(
            (req) => req.uid === uid && req.status === "pending"
        );
        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Add incoming request to target user
        targetUser.friendRequests.incoming.push({ uid, status: "pending" });
        await targetUser.save();

        // Add outgoing request to sender
        user.friendRequests.outgoing.push({ uid: targetUid, status: "pending" });
        await user.save();

        res.status(200).json({ message: "Friend request sent" });
    } catch (err) {
        handleDBError(res, err);
    }
});

// Accept friend request
router.patch("/:uid/friend-requests/:senderUid/accept", async (req, res) => {
    try {
        const { uid, senderUid } = req.params;

        const user = await User.findOne({ uid });
        const senderUser = await User.findOne({ uid: senderUid });

        if (!user || !senderUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find and remove incoming request
        user.friendRequests.incoming = user.friendRequests.incoming.filter(
            (req) => req.uid !== senderUid
        );

        // Find and remove outgoing request from sender
        senderUser.friendRequests.outgoing = senderUser.friendRequests.outgoing.filter(
            (req) => req.uid !== uid
        );

        // Add to friends list
        if (!user.friends.includes(senderUid)) {
            user.friends.push(senderUid);
        }
        if (!senderUser.friends.includes(uid)) {
            senderUser.friends.push(uid);
        }

        await user.save();
        await senderUser.save();

        res.status(200).json({ message: "Friend request accepted" });
    } catch (err) {
        handleDBError(res, err);
    }
});

// Decline friend request
router.patch("/:uid/friend-requests/:senderUid/decline", async (req, res) => {
    try {
        const { uid, senderUid } = req.params;

        const user = await User.findOne({ uid });
        const senderUser = await User.findOne({ uid: senderUid });

        if (!user || !senderUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove incoming request
        user.friendRequests.incoming = user.friendRequests.incoming.filter(
            (req) => req.uid !== senderUid
        );

        // Remove outgoing request from sender
        senderUser.friendRequests.outgoing = senderUser.friendRequests.outgoing.filter(
            (req) => req.uid !== uid
        );

        await user.save();
        await senderUser.save();

        res.status(200).json({ message: "Friend request declined" });
    } catch (err) {
        handleDBError(res, err);
    }
});

export default router;