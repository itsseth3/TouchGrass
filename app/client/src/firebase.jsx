import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
  await api.post("/users", {uid: user.uid, email: user.email, firstName: fName, lastName: lName, location: loc});
  return user;
}

//user login
export async function loginUser(email, password){
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

//log out
export async function logOut(){
  await signOut(auth);
}