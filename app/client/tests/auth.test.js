import {describe, it, expect, afterAll, beforeAll, vi} from "vitest";
import { registerUser, loginUser, logOut, parseError, auth} from "../src/firebase.jsx";
import { deleteUser } from "firebase/auth";
import api from "../src/api.jsx";

vi.mock("../src/api.jsx");

describe("Firebase Tests", () => {
    let validUser;
    beforeAll(() => {
        api.post.mockResolvedValue({});
    });

    it("Attempts to create user with weak password (should fail)", async() => {
        await expect(registerUser("testValidCreate@gmail.com", "123", "testFirst", "testLast", [0,0])).rejects.toMatchObject({code: "auth/weak-password"});
    });

    it("Creates valid new user in firebase (mock db request)", async() => {
        validUser = await registerUser("testValidCreate@gmail.com", "123456", "testFirst", "testLast", [0,0]);
        expect(validUser).toBeDefined();
        expect(api.post).toHaveBeenCalledWith("/users", expect.any(Object));
    });

    it("Logs validUser out", async() => {
        await logOut();
        expect(auth.currentUser).toBeNull();
    });

    //should fail
    it("Attempts to create user with duplicate email (should fail)", async() => {
        await expect(registerUser("testValidCreate@gmail.com", "123435235", "testFirst", "testLast", [0,0])).rejects.toMatchObject({code: "auth/email-already-in-use"});
    });

    it("Attempts to log validUser in with wrong password (should fail)", async() => {
        await expect(loginUser("testValidCreate@gmail.com", "12323153")).rejects.toMatchObject({code: "auth/invalid-credential"});
    });

    

    //cleanup
    afterAll(async() => {
        await deleteUser(validUser);
    });
});