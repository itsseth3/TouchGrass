import "dotenv/config";
import request from "supertest";
import app from "../src/app.js";
import Post from "../models/Post.js";

describe("Posts Routes", () => {
    let createdPostId;
    const testUserId = "test-user-001";
    const anotherUserId = "test-user-002";

    beforeAll(async () => {
        // Clean up any existing test posts
        await Post.deleteMany({ uid: { $in: [testUserId, anotherUserId] } });
    }, 30000);

    afterAll(async () => {
        // Clean up test posts
        await Post.deleteMany({ uid: { $in: [testUserId, anotherUserId] } });
    }, 30000);

    describe("POST /api/posts", () => {
        it("creates a new post with all required fields", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Test Activity",
                    content: "This is a test post about outdoor activities",
                    location: {
                        type: "Point",
                        coordinates: [-82.1648, 29.6436] // Gainesville, FL
                    },
                    activity: "Hiking",
                    image: "https://example.com/image.jpg",
                    visibility: "public"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.uid).toBe(testUserId);
            expect(res.body.title).toBe("Test Activity");
            expect(res.body.content).toBe("This is a test post about outdoor activities");
            expect(res.body.likes).toBe(0);
            expect(res.body.visibility).toBe("public");
            expect(res.body._id).toBeDefined();

            createdPostId = res.body._id;
        });

        it("creates a post with minimum required fields", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Minimal Post",
                    content: "Post with only required fields",
                    location: {
                        type: "Point",
                        coordinates: [-82.1648, 29.6436]
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.activity).toBeUndefined();
            expect(res.body.image).toBeUndefined();
            expect(res.body.visibility).toBe("public");
        });

        it("fails when missing uid", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    title: "Test",
                    content: "Test content",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("Missing required fields");
        });

        it("fails when missing title", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    content: "Test content",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });

            expect(res.statusCode).toBe(400);
        });

        it("fails when missing content", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Test",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });

            expect(res.statusCode).toBe(400);
        });

        it("fails when missing location", async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Test",
                    content: "Test content"
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/posts", () => {
        it("retrieves all posts sorted by creation date (newest first)", async () => {
            // Create another post for comparison
            await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Second Post",
                    content: "Another test post",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });

            const res = await request(app).get("/api/posts");

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);

            // Check if sorted by creation date (newest first)
            for (let i = 0; i < res.body.length - 1; i++) {
                const currentDate = new Date(res.body[i].createdAt);
                const nextDate = new Date(res.body[i + 1].createdAt);
                expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }
        });
    });

    describe("GET /api/posts/user/:uid", () => {
        it("retrieves all posts by a specific user", async () => {
            const res = await request(app)
                .get(`/api/posts/user/${testUserId}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.every(post => post.uid === testUserId)).toBe(true);
        });

        it("returns empty array for user with no posts", async () => {
            const res = await request(app)
                .get(`/api/posts/user/non-existent-user-xyz`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it("returns posts sorted by creation date (newest first)", async () => {
            const res = await request(app)
                .get(`/api/posts/user/${testUserId}`);

            expect(res.statusCode).toBe(200);

            for (let i = 0; i < res.body.length - 1; i++) {
                const currentDate = new Date(res.body[i].createdAt);
                const nextDate = new Date(res.body[i + 1].createdAt);
                expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }
        });
    });

    describe("GET /api/posts/:postId", () => {
        it("retrieves a single post by ID", async () => {
            const res = await request(app)
                .get(`/api/posts/${createdPostId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body._id).toBe(createdPostId);
            expect(res.body.uid).toBe(testUserId);
        });

        it("returns 404 for non-existent post", async () => {
            const fakeId = "507f1f77bcf86cd799439011"; // Valid MongoDB ObjectId format

            const res = await request(app)
                .get(`/api/posts/${fakeId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Post not found");
        });
    });

    describe("PATCH /api/posts/:postId", () => {
        it("updates post title and content", async () => {
            const res = await request(app)
                .patch(`/api/posts/${createdPostId}`)
                .send({
                    title: "Updated Title",
                    content: "Updated content"
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe("Updated Title");
            expect(res.body.content).toBe("Updated content");
            expect(res.body.uid).toBe(testUserId);
        });

        it("updates post visibility", async () => {
            const res = await request(app)
                .patch(`/api/posts/${createdPostId}`)
                .send({
                    visibility: "friends"
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.visibility).toBe("friends");
        });

        it("updates multiple fields simultaneously", async () => {
            const res = await request(app)
                .patch(`/api/posts/${createdPostId}`)
                .send({
                    title: "Multi-Update",
                    activity: "Biking",
                    visibility: "private"
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe("Multi-Update");
            expect(res.body.activity).toBe("Biking");
            expect(res.body.visibility).toBe("private");
        });

        it("updates the updatedAt timestamp", async () => {
            const getRes = await request(app)
                .get(`/api/posts/${createdPostId}`);
            const originalUpdatedAt = new Date(getRes.body.updatedAt);

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 100));

            const patchRes = await request(app)
                .patch(`/api/posts/${createdPostId}`)
                .send({
                    title: "Timestamp Test"
                });

            const newUpdatedAt = new Date(patchRes.body.updatedAt);
            expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

        it("returns 404 when updating non-existent post", async () => {
            const fakeId = "507f1f77bcf86cd799439011";

            const res = await request(app)
                .patch(`/api/posts/${fakeId}`)
                .send({
                    title: "Update"
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Post not found");
        });
    });

    describe("PATCH /api/posts/:postId/like", () => {
        let likeTestPostId;

        beforeAll(async () => {
            const res = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Like Test Post",
                    content: "Post for testing likes",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });
            likeTestPostId = res.body._id;
        }, 30000);

        it("likes a post and increments like count", async () => {
            const res = await request(app)
                .patch(`/api/posts/${likeTestPostId}/like`)
                .send({ uid: "user-001" });

            expect(res.statusCode).toBe(200);
            expect(res.body.likes).toBe(1);
            expect(res.body.likedBy).toContain("user-001");
        });

        it("prevents duplicate likes from same user", async () => {
            // Try to like again with same user
            const res = await request(app)
                .patch(`/api/posts/${likeTestPostId}/like`)
                .send({ uid: "user-001" });

            expect(res.statusCode).toBe(200);
            expect(res.body.likes).toBe(1); // Should still be 1
            expect(res.body.likedBy.filter(id => id === "user-001").length).toBe(1);
        });

        it("allows multiple users to like the same post", async () => {
            const res = await request(app)
                .patch(`/api/posts/${likeTestPostId}/like`)
                .send({ uid: "user-002" });

            expect(res.statusCode).toBe(200);
            expect(res.body.likes).toBe(2);
            expect(res.body.likedBy).toContain("user-001");
            expect(res.body.likedBy).toContain("user-002");
        });

        it("fails when uid is missing", async () => {
            const res = await request(app)
                .patch(`/api/posts/${likeTestPostId}/like`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("User UID is required");
        });

        it("returns 404 for non-existent post", async () => {
            const fakeId = "507f1f77bcf86cd799439011";

            const res = await request(app)
                .patch(`/api/posts/${fakeId}/like`)
                .send({ uid: "user-001" });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Post not found");
        });
    });

    describe("PATCH /api/posts/:postId/unlike", () => {
        let unlikeTestPostId;

        beforeAll(async () => {
            // Create post and add likes
            const postRes = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "Unlike Test Post",
                    content: "Post for testing unlikes",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });
            unlikeTestPostId = postRes.body._id;

            // Add multiple likes
            await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/like`)
                .send({ uid: "user-001" });
            await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/like`)
                .send({ uid: "user-002" });
        }, 30000);

        it("unlikes a post and decrements like count", async () => {
            const res = await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/unlike`)
                .send({ uid: "user-001" });

            expect(res.statusCode).toBe(200);
            expect(res.body.likes).toBe(1);
            expect(res.body.likedBy).not.toContain("user-001");
            expect(res.body.likedBy).toContain("user-002");
        });

        it("prevents decrementing likes below 0", async () => {
            // Unlike remaining like
            await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/unlike`)
                .send({ uid: "user-002" });

            // Try to unlike again (should not go below 0)
            const res = await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/unlike`)
                .send({ uid: "user-002" });

            expect(res.statusCode).toBe(200);
            expect(res.body.likes).toBe(0);
            expect(res.body.likedBy.length).toBe(0);
        });

        it("fails when uid is missing", async () => {
            const res = await request(app)
                .patch(`/api/posts/${unlikeTestPostId}/unlike`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("User UID is required");
        });

        it("returns 404 for non-existent post", async () => {
            const fakeId = "507f1f77bcf86cd799439011";

            const res = await request(app)
                .patch(`/api/posts/${fakeId}/unlike`)
                .send({ uid: "user-001" });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Post not found");
        });
    });

    describe("DELETE /api/posts/:postId", () => {
        it("deletes a post successfully", async () => {
            // Create a post to delete
            const createRes = await request(app)
                .post("/api/posts")
                .send({
                    uid: testUserId,
                    title: "To Delete",
                    content: "This post will be deleted",
                    location: { type: "Point", coordinates: [-82.1648, 29.6436] }
                });

            const postIdToDelete = createRes.body._id;

            // Delete the post
            const deleteRes = await request(app)
                .delete(`/api/posts/${postIdToDelete}`);

            expect(deleteRes.statusCode).toBe(200);
            expect(deleteRes.body.message).toBe("Post deleted successfully");

            // Verify post is gone
            const getRes = await request(app)
                .get(`/api/posts/${postIdToDelete}`);

            expect(getRes.statusCode).toBe(404);
        });

        it("returns 404 when deleting non-existent post", async () => {
            const fakeId = "507f1f77bcf86cd799439011";

            const res = await request(app)
                .delete(`/api/posts/${fakeId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Post not found");
        });
    });
});
