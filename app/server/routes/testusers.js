//for tests
import express from "express";
import { TestUser } from "../models/User.js";
import handleDBError from "../utils/errors.js";

const router = express.Router();

//get user by uid
router.get("/:uid", async (req, res) => {
    try{
        const user = await TestUser.findOne({uid: req.params.uid});
        res.json(user);
    } catch(err){
        handleDBError(res, err);
    }
    
});

//get 
router.get("/", async (req, res) => {
    try{
        const user = await TestUser.find();
        res.json(user);
    } catch(err){
        handleDBError(res, err);
    }
    
});

//post (create user)
router.post("/", async (req, res) => {
     try{
        const user = new TestUser(req.body);
        await user.save();
        res.status(201).json(user);
    } catch(err){
        handleDBError(res, err);
    }
});

//post (update user)
// router.post("/", async (req, res) => {
//      try{
//         const user = new TestUser(req.body);
//         await user.save();
//         res.json(user);
//     } catch(err){
//        handleDBError(res, err);
//     }
// });

export default router;

