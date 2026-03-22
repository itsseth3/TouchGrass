import {describe, it, expect, afterAll, beforeAll, vi, afterEach} from "vitest";
import { registerUser, loginUser, logOut, parseError, auth} from "../src/firebase.jsx";
import { deleteUser } from "firebase/auth";
import Register from "../src/pages/Register.jsx";
import {render, screen, waitFor, fireEvent, cleanup} from '@testing-library/react';
import { MemoryRouter } from "react-router-dom";

describe("Login and Register Tests", () => {
    //so only components from one form appear at a time
    afterEach(() => {
        cleanup();
    });

    it("Registers new user", async () => {
        //integration test for creating a user 
        //memory router bc using useNavigate
        render(<MemoryRouter> 
                 <Register />
        </MemoryRouter>
       );


        //sign up button
        fireEvent.click(screen.getByText('SIGN UP'));

        //fill in form
        fireEvent.change(screen.getByPlaceholderText('First Name'), {target: {value: 'TestFirstUI'}});
        fireEvent.change(screen.getByPlaceholderText('Last Name'), {target: {value: 'TestLastUI'}});
        fireEvent.change(screen.getByPlaceholderText('Email'), {target: {value: 'testUI@test.com'}});
        fireEvent.change(screen.getByPlaceholderText('Password'), {target: {value: '123456'}});

         fireEvent.change(screen.getByPlaceholderText('Location'), {target: {value: 'Miami FL'}});
         fireEvent.click(screen.getByText('Search Location'));

         //wait for response from openstreetview
         await waitFor(() => {
            expect(screen.getByDisplayValue('Miami, Miami-Dade County, Florida, United States')).toBeDefined();
         });
         

        fireEvent.submit(screen.getByText('CREATE ACCOUNT'));

        //firebase account creation delay
        await waitFor(() => {
            expect(auth.currentUser).not.toBeNull();
        });

    });

    it("Logs in user created in previous test", async () => { 
        //log user out first
        await logOut();

        //memory router bc using useNavigate
        render(<MemoryRouter> 
                 <Register />
        </MemoryRouter>
       );

        //fill in form
        fireEvent.change(screen.getByPlaceholderText('Email'), {target: {value: 'testUI@test.com'}});
        fireEvent.change(screen.getByPlaceholderText('Password'), {target: {value: '123456'}});
         

        fireEvent.submit(screen.getByText('LOG IN'));

        await waitFor(() => {
            expect(auth.currentUser).not.toBeNull();
        });

    });

    //clean up
    afterAll(async () => {
        if(auth.currentUser){
            await deleteUser(auth.currentUser);
        }
    });
});