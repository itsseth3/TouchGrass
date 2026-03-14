import express from "express";
import User from "../models/User.js";

const router = express.Router();

//get user by uid
router.get("/:uid", async (req, res) => {
    try{
        const user = await User.findOne({uid: req.params.uid});
        res.json(user);
    } catch(err){
        res.status(500).json({error: err.message});
    }
    
});

//get 
router.get("/", async (req, res) => {
    try{
        const user = await User.find();
        res.json(user);
    } catch(err){
        res.status(500).json({error: err.message});
    }
    
});

//post (create user)
router.post("/", async (req, res) => {
     try{
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch(err){
        res.status(500).json({error: err.message});
    }
});

//post (update user)
// router.post("/", async (req, res) => {
//      try{
//         const user = new User(req.body);
//         await user.save();
//         res.json(user);
//     } catch(err){
//         res.status(500).json({error: err.message});
//     }
// });

export default router;

