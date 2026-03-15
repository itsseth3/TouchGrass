import mongoose from "mongoose"

//references
//schema: https://www.mongodb.com/docs/drivers/node/current/integrations/mongoose/mongoose-get-started/
//geolocation: https://geojson.org/, https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere/

const userSchema = new mongoose.Schema({
    uid: {type: String, required: true, unique: true}, //indexed bc unique
    email: {type: String, required: true, unique: true}, //indexed bc unique
    firstName: {type: String, required: true, default: ""},
    lastName: {type: String, required: true, default: ""},
    location: {
        type: {type: String, default: "Point"},
        coordinates: {type: [Number], default: [0, 0] }, //long, lat
    },
    // preferences: {
    //     activityCategories: [{type: String}],
    //     budget: ,
    //     timeNeeded: ,
    //     searchRadius: 
    // },
});

//index by location to find other users by proximity 
userSchema.index({location:"2dsphere"});

export default mongoose.model("User", userSchema);