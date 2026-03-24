import express from "express";
import mongoose from "mongoose";
import userRoutes from "../routes/users.js"
import placesRoutes from "../routes/places.js"
import testUserRoutes from "../routes/testusers.js";
import postsRoutes from "../routes/posts.js";
import cors from "cors"; 
const app = express();

app.use(cors({origin: true})); //to enable client side requests to server running on port 3000

app.use(express.json());


app.use("/api/users", userRoutes);

app.use("/api/places", placesRoutes);

app.use("/api/testusers", testUserRoutes);

app.use("/api/posts", postsRoutes);

const uri = process.env.MONGO_URI;
console.log("URI: ", uri);

mongoose.connect(uri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err));


//TEST CONNECTION
// const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
// async function run() {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await mongoose.disconnect();
//   }
// }
// run().catch(console.dir);


export default app;