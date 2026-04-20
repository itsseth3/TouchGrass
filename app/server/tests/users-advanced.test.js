import "dotenv/config";
import { TestUser } from "../models/User.js";
import request from "supertest";
import app from "../src/app.js";

describe("Advanced User Routes", () => {
    const user1Uid = "advanced-test-user-001";
    const user2Uid = "advanced-test-user-002";
    const user3Uid = "advanced-test-user-003";

    beforeAll(async () => {
        // Clean up test users
        await TestUser.deleteMany({
            uid: { $in: [user1Uid, user2Uid, user3Uid] }
        });

        // Create test users
        await request(app)
            .post("/api/testusers")
            .send({
                uid: user1Uid,
                email: "advtest001@test.com",
                firstName: "AdvTest",
                lastName: "One"
            });

        await request(app)
            .post("/api/testusers")
            .send({
                uid: user2Uid,
                email: "advtest002@test.com",
                firstName: "AdvTest",
                lastName: "Two"
            });

        await request(app)
            .post("/api/testusers")
            .send({
                uid: user3Uid,
                email: "advtest003@test.com",
                firstName: "AdvTest",
                lastName: "Three"
            });
    }, 30000);

    afterAll(async () => {
        // Clean up
        await TestUser.deleteMany({
            uid: { $in: [user1Uid, user2Uid, user3Uid] }
        });
    }, 30000);

    describe("GET /api/users/search/all/users", () => {
        it("retrieves all users for friend discovery", async () => {
            const res = await request(app)
                .get("/api/users/search/all/users");

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);

            // Check that each user has required fields
            res.body.forEach(user => {
                expect(user.uid).toBeDefined();
                expect(user.email).toBeDefined();
                expect(user.firstName).toBeDefined();
                expect(user.lastName).toBeDefined();
            });
        });

        it("returns only specified fields (no password or sensitive data)", async () => {
            const res = await request(app)
                .get("/api/users/search/all/users");

            expect(res.statusCode).toBe(200);

            res.body.forEach(user => {
                // Should not include password or other sensitive fields
                expect(user.password).toBeUndefined();
                expect(user.friendRequests).toBeUndefined();
            });
        });
    });

    describe("Friend Request Routes", () => {
        describe("POST /api/users/:uid/friend-requests/:targetUid", () => {
            it("sends a friend request successfully", async () => {
                const res = await request(app)
                    .post(`/api/users/${user1Uid}/friend-requests/${user2Uid}`);

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe("Friend request sent");
            });

            it("prevents sending friend request to yourself", async () => {
                const res = await request(app)
                    .post(`/api/users/${user1Uid}/friend-requests/${user1Uid}`);

                expect(res.statusCode).toBe(400);
                expect(res.body.message).toBe("Cannot send friend request to yourself");
            });

            it("prevents duplicate friend requests", async () => {
                // First request already sent in previous test
                const res = await request(app)
                    .post(`/api/users/${user1Uid}/friend-requests/${user2Uid}`);

                expect(res.statusCode).toBe(400);
                expect(res.body.message).toBe("Friend request already sent");
            });

            it("returns 404 when sender user does not exist", async () => {
                const res = await request(app)
                    .post(`/api/users/non-existent-user/friend-requests/${user2Uid}`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });

            it("returns 404 when target user does not exist", async () => {
                const res = await request(app)
                    .post(`/api/users/${user1Uid}/friend-requests/non-existent-user`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });

            it("properly tracks outgoing and incoming requests", async () => {
                // Get user1 to check outgoing requests
                const user1Res = await request(app)
                    .get(`/api/users/${user1Uid}`);

                const outgoingRequests = user1Res.body.friendRequests.outgoing;
                expect(outgoingRequests.some(req => req.uid === user2Uid)).toBe(true);

                // Get user2 to check incoming requests
                const user2Res = await request(app)
                    .get(`/api/users/${user2Uid}`);

                const incomingRequests = user2Res.body.friendRequests.incoming;
                expect(incomingRequests.some(req => req.uid === user1Uid)).toBe(true);
            });
        });

        describe("PATCH /api/users/:uid/friend-requests/:senderUid/accept", () => {
            it("accepts a friend request successfully", async () => {
                const res = await request(app)
                    .patch(`/api/users/${user2Uid}/friend-requests/${user1Uid}/accept`);

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe("Friend request accepted");
            });

            it("adds both users to each other's friend list after accepting", async () => {
                const user1Res = await request(app)
                    .get(`/api/users/${user1Uid}`);

                const user2Res = await request(app)
                    .get(`/api/users/${user2Uid}`);

                expect(user1Res.body.friends).toContain(user2Uid);
                expect(user2Res.body.friends).toContain(user1Uid);
            });

            it("removes request from both users after accepting", async () => {
                const user1Res = await request(app)
                    .get(`/api/users/${user1Uid}`);

                const user2Res = await request(app)
                    .get(`/api/users/${user2Uid}`);

                expect(user1Res.body.friendRequests.outgoing.some(req => req.uid === user2Uid)).toBe(false);
                expect(user2Res.body.friendRequests.incoming.some(req => req.uid === user1Uid)).toBe(false);
            });

            it("returns 404 when receiver user does not exist", async () => {
                const res = await request(app)
                    .patch(`/api/users/non-existent-user/friend-requests/${user1Uid}/accept`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });

            it("returns 404 when sender user does not exist", async () => {
                const res = await request(app)
                    .patch(`/api/users/${user2Uid}/friend-requests/non-existent-user/accept`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });
        });

        describe("PATCH /api/users/:uid/friend-requests/:senderUid/decline", () => {
            beforeAll(async () => {
                // Create a pending friend request to decline
                await request(app)
                    .post(`/api/users/${user1Uid}/friend-requests/${user3Uid}`);
            }, 30000);

            it("declines a friend request successfully", async () => {
                const res = await request(app)
                    .patch(`/api/users/${user3Uid}/friend-requests/${user1Uid}/decline`);

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe("Friend request declined");
            });

            it("removes request from both users after declining", async () => {
                const user1Res = await request(app)
                    .get(`/api/users/${user1Uid}`);

                const user3Res = await request(app)
                    .get(`/api/users/${user3Uid}`);

                expect(user1Res.body.friendRequests.outgoing.some(req => req.uid === user3Uid)).toBe(false);
                expect(user3Res.body.friendRequests.incoming.some(req => req.uid === user1Uid)).toBe(false);
            });

            it("does not add users to friend list after declining", async () => {
                const user1Res = await request(app)
                    .get(`/api/users/${user1Uid}`);

                const user3Res = await request(app)
                    .get(`/api/users/${user3Uid}`);

                expect(user1Res.body.friends).not.toContain(user3Uid);
                expect(user3Res.body.friends).not.toContain(user1Uid);
            });

            it("returns 404 when receiver user does not exist", async () => {
                const res = await request(app)
                    .patch(`/api/users/non-existent-user/friend-requests/${user1Uid}/decline`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });

            it("returns 404 when sender user does not exist", async () => {
                const res = await request(app)
                    .patch(`/api/users/${user3Uid}/friend-requests/non-existent-user/decline`);

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toBe("User not found");
            });
        });

        describe("Friend request flow scenarios", () => {
            it("completes full flow: send -> accept", async () => {
                const testSenderId = "friend-flow-sender";
                const testReceiverId = "friend-flow-receiver";

                // Clean up any existing test users
                await TestUser.deleteMany({
                    uid: { $in: [testSenderId, testReceiverId] }
                });

                // Create users
                await request(app)
                    .post("/api/testusers")
                    .send({
                        uid: testSenderId,
                        email: "flowsender@test.com",
                        firstName: "Flow",
                        lastName: "Sender"
                    });

                await request(app)
                    .post("/api/testusers")
                    .send({
                        uid: testReceiverId,
                        email: "flowreceiver@test.com",
                        firstName: "Flow",
                        lastName: "Receiver"
                    });

                // Send request
                let res = await request(app)
                    .post(`/api/users/${testSenderId}/friend-requests/${testReceiverId}`);
                expect(res.statusCode).toBe(200);

                // Verify pending state
                res = await request(app).get(`/api/users/${testReceiverId}`);
                expect(res.body.friendRequests.incoming.some(req => req.uid === testSenderId && req.status === "pending")).toBe(true);

                // Accept request
                res = await request(app)
                    .patch(`/api/users/${testReceiverId}/friend-requests/${testSenderId}/accept`);
                expect(res.statusCode).toBe(200);

                // Verify friendship established
                res = await request(app).get(`/api/users/${testSenderId}`);
                expect(res.body.friends).toContain(testReceiverId);

                res = await request(app).get(`/api/users/${testReceiverId}`);
                expect(res.body.friends).toContain(testSenderId);

                // Clean up
                await TestUser.deleteMany({
                    uid: { $in: [testSenderId, testReceiverId] }
                });
            }, 60000);

            it("completes full flow: send -> decline -> can send again", async () => {
                const testSenderId = "flow-decline-sender";
                const testReceiverId = "flow-decline-receiver";

                // Clean up
                await TestUser.deleteMany({
                    uid: { $in: [testSenderId, testReceiverId] }
                });

                // Create users
                await request(app)
                    .post("/api/testusers")
                    .send({
                        uid: testSenderId,
                        email: "flowdeclinesender@test.com",
                        firstName: "Flow",
                        lastName: "DeclineSender"
                    });

                await request(app)
                    .post("/api/testusers")
                    .send({
                        uid: testReceiverId,
                        email: "flowdeclinereceiver@test.com",
                        firstName: "Flow",
                        lastName: "DeclineReceiver"
                    });

                // Send and decline
                await request(app)
                    .post(`/api/users/${testSenderId}/friend-requests/${testReceiverId}`);

                let res = await request(app)
                    .patch(`/api/users/${testReceiverId}/friend-requests/${testSenderId}/decline`);
                expect(res.statusCode).toBe(200);

                // Should be able to send again
                res = await request(app)
                    .post(`/api/users/${testSenderId}/friend-requests/${testReceiverId}`);
                expect(res.statusCode).toBe(200);

                // Clean up
                await TestUser.deleteMany({
                    uid: { $in: [testSenderId, testReceiverId] }
                });
            }, 60000);
        });
    });

    describe("Additional User CRUD Tests", () => {
        it("gets all users successfully", async () => {
            const res = await request(app).get("/api/users");

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("gets specific user by uid", async () => {
            const res = await request(app)
                .get(`/api/users/${user1Uid}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.uid).toBe(user1Uid);
            expect(res.body.firstName).toBe("AdvTest");
        });

        it("updates user information", async () => {
            const res = await request(app)
                .patch(`/api/users/${user1Uid}`)
                .send({
                    firstName: "UpdatedName",
                    location: [29.6436, -82.1648]
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.firstName).toBe("UpdatedName");
            expect(res.body.location).toEqual([29.6436, -82.1648]);
        });

        it("deletes a user successfully", async () => {
            const tempUid = "temp-user-to-delete";

            // Create temp user
            await request(app)
                .post("/api/testusers")
                .send({
                    uid: tempUid,
                    email: "tempdelete@test.com",
                    firstName: "Temp",
                    lastName: "Delete"
                });

            // Delete it
            const deleteRes = await request(app)
                .delete(`/api/users/${tempUid}`);

            expect(deleteRes.statusCode).toBe(200);

            // Verify deletion
            const getRes = await request(app)
                .get(`/api/users/${tempUid}`);

            expect(getRes.body).toBeNull();
        });
    });
});
