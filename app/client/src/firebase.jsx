import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import api from "./api.jsx"

const firebaseConfig = {
  apiKey: "AIzaSyChgF4caKxB3kVlX3KmKDmMy3gBiVxyDpA",
  authDomain: "touchgrass-91338.firebaseapp.com",
  projectId: "touchgrass-91338",
  storageBucket: "touchgrass-91338.firebasestorage.app",
  messagingSenderId: "966957519386",
  appId: "1:966957519386:web:434115a6e114643c5877a3",
  measurementId: "G-35TT021CYY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

//references:
//https://firebase.google.com/docs/auth/web/password-auth#web
//error codes: https://firebase.google.com/docs/auth/admin/errors 

//register user
export async function registerUser(email, password, fName, lName, loc){
  console.log("REGISTER USER CALLED");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  console.log("UID: ", user.uid);
  console.log("EMAIL: ", user.email);
  console.log("NAME: ", fName, " ", lName);
  console.log("LOCATION: ", loc);
  console.log("URL: ", api.defaults.baseURL);
  localStorage.setItem("userUID", user.uid);
  await api.post("/users", {uid: user.uid, email: user.email, firstName: fName, lastName: lName, location: loc});
  return user;
}

//user login
export async function loginUser(email, password){
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  localStorage.setItem("userUID", userCredential.user.uid);
  return userCredential.user;
}

//log out
export async function logOut(){
  await signOut(auth);
  localStorage.removeItem("userUID");
}

//delete account in mongoDB and Firebase
export async function deleteAccount(uid, password){
  try {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found.");
    }

    if (!password?.trim()) {
      throw new Error("Enter your password to confirm account deletion.");
    }

    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);

    await deleteUser(auth.currentUser);
    await api.delete(`/users/${uid}`);
    localStorage.removeItem("userUID");
  } catch (error) {
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    }

    if (error.code === "auth/requires-recent-login") {
      throw new Error("Please confirm your password again before deleting your account.");
    }

    throw error;
  }
}


//parse error codes 
export function parseError(errorCode){
  switch(errorCode){
    //login
    case "auth/invalid-credential":
      return "Invalid email or password.";

    //register
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email";
    case "auth/weak-password":
        return "Password must be at least 6 characters";
    
    default:
      return "Something went wrong. Please try again.";
  }
}