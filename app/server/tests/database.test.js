import "dotenv/config";
import { TestUser } from "../models/User.js";
import request from "supertest";
import app from "../src/app.js";


//test reference: https://medium.com/@it.ermias.asmare/node-js-express-with-jest-and-supertest-e58aaf4c4514 

describe("User Routes", () => {
    it("create new user", async () => {
        const res = await request(app)
        .post("/api/testusers")
        .send({
            "uid": "testuid001",
            "email": "testuser001@testusers.com",
            "firstName": "TestFirst001",
            "lastName": "TestLast001",
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.email).toBe("testuser001@testusers.com");
    });

    //clean up
    //delete user from create new
    afterAll(async () => {
        await TestUser.deleteMany({uid: "testuid001"});
    });
});
