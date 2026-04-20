import mongoose from "mongoose"

//references
//schema: https://www.mongodb.com/docs/drivers/node/current/integrations/mongoose/mongoose-get-started/
//geolocation: https://geojson.org/, https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere/

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true }, //indexed bc unique
    email: { type: String, required: true, unique: true }, //indexed bc unique
    firstName: { type: String, required: true, default: "" },
    lastName: { type: String, required: true, default: "" },
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, //lat, long
    },
    preferences: {
        includedTypes: { type: [String], default: [] },
        excludedTypes: { type: [String], default: [] },
        priceLevels: {
            type: [Number],
            enum: [
                0,
                1,
                2,
                3,
                4,
            ],
            default: [],
        },
        minRating: { type: Number, min: 0, max: 5, default: 0 },
        radiusMeters: { type: Number, min: 1, default: 16093 },
        openNow: { type: Boolean, default: false },
    },
    friends: {
        type: [String],
        default: [],
    },
    friendRequests: {
        incoming: [ 
            {
                uid: { type: String, required: true }, //sender uid
                status: {
                    type: String,
                    enum: ["pending", "accepted", "declined"],
                    default: "pending",
                },
                timestamp: {type: Date, default: Date.now},
            },
        ],
         outgoing: [
            {
                uid: { type: String, required: true }, //recipient uid
                status: {
                    type: String,
                    enum: ["pending", "accepted", "declined"],
                    default: "pending",
                },
                timestamp: {type: Date, default: Date.now},
            },
        ],
    },
});

//index by location to find other users by proximity 
userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
export const TestUser = mongoose.model("TestUser", userSchema);
