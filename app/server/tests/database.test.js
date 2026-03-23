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

    it("gets user by uid", async () => {
        const res = await request(app)
        .get("/api/testusers/testuid001");

        expect(res.statusCode).toBe(200);
        expect(res.body.uid).toBe("testuid001");
    });

    it("updates user email field", async () => {
        const res = await request(app)
        .patch("/api/testusers/testuid001")
        .send({
            "email": "testuser001UPDATED@testusers.com"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe("testuser001UPDATED@testusers.com");
        expect(res.body.firstName).toBe("TestFirst001");
    });

    

    it("Attempts to create duplicate user (should fail)", async () => {
        const res = await request(app)
            .post("/api/testusers")
            .send({
                "uid": "testuid002",

                "email": "testuser001UPDATED@testusers.com",
                "firstName": "TestFirst001",
                "lastName": "TestLast001",
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Email already exists");
    });


    it("deletes user by uid", async () => {
        const res = await request(app)
        .delete("/api/testusers/testuid001");
        
        expect(res.statusCode).toBe(200);
    });

    it("Attempts to delete nonexistent user (should fail)", async () => {
        const res = await request(app)
        .delete("/api/testusers/testuid001");

        expect(res.statusCode).toBe(404);
    }); 

    //get nonexistent user by uid

    //clean up
    //delete user from create new
    afterAll(async () => {
        await TestUser.deleteMany({uid: "testuid001"});
    });
});



