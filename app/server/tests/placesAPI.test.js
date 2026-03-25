import "dotenv/config";
import request from "supertest";
import app from "../src/app.js";


describe( "Place API routes", () => {
    describe("GET /api/places/autocomplete", () => {
        it("fails and returns 400 when input query is missing", async () => {
            const res = await request(app).get("/api/places/autocomplete");
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe("Input Required."); 
        });

        it("succeeds when a valid input is provided", async () => {
            const res = await request(app).get("/api/places/autocomplete?input=Gainesville");
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.predictions).toBeDefined(); 
        });
    });

    describe("GET /api/places/details", () => {
        it("fails and returns 400 when place_id is missing", async () => {
            const res = await request(app).get("/api/places/details");
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe("Place ID Required.");
        });
    });
});