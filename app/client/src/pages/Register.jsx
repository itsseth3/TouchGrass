import { use, useState } from "react";
import { registerUser, loginUser } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function register() {
    const [mode, setMode] = useState("Login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fName, setfName] = useState("");
    const [lName, setlName] = useState("");
    const [location, setLocation] = useState(null);
    const [locationInput, setLocationInput] = useState("");
    const [locationValid, setLocationValid] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate(); //redirect pages

    //handle login
    const handleLogin = async () => {
        try{
            await loginUser(email, password);
            navigate("/home");
        } catch(err){
            setError(err.message);
        }
    };


    //handle register
    const handleRegister = async () => {
        console.log("HANDLE REGISTER CALLED CALLED");
        try{
            await registerUser(email, password, fName, lName, location);
            navigate("/home");
        } catch(err){
            setError(err.message);
            console.log(err.message);
        }
    };

    //handle geolocation
    const handleGeolocation = async () => {
        try{
                navigator.geolocation.getCurrentPosition(
                 (pos) => {
                    const lat = pos.coords.latitude;
                    const long = pos.coords.longitude;
                    console.log("LAT: ", lat, "LONG: ", long);
                    console.log("COORDS: ", pos.coords);
                    setLocation({
                        type: "Point",
                        coordinates: [long, lat] //reverse for google places
                    });

                    setReadableLocation(lat, long); //repopulate location field with result
                },

                (err) => setError("LOCATION ERROR: " + err.message), 
                {enableHighAccuracy:false, timeout:5000}
            );
            console.log("LOCATION: ", location);
        }catch(err){
            console.log(error);
        }
    };

    //handle manual location input with openstreetview
    //https://nominatim.org/release-docs/develop/api/Search/
    const handleManualLocationSearch = async ()  => {
        try{
            const res = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {q: locationInput, format:"json", limit: 1},
            });
            
            //if no results prompt to retry
            if(res.data.length == 0){
                setError("Unable to find location, please try being more specific.");
                return;
            }
            
            const {lat, lon} = res.data[0];
            console.log("LAT: ", lat);
            console.log("LONG: ", lon);
            setLocationInput(res.data[0].display_name); //repopulate location field with result

            setLocation({type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)]});
            setLocationValid(true);
        } catch(err){
            setError("Error: Cannot search location");
        }
    };

    //get human readable location to show user from lat and long
    const setReadableLocation = async(lat, long) => {
        console.log("CALLED SET READABLE");
        console.log("LAT: ", lat, "LONG: ", long);
        try {
            const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                params: {lat: lat, lon: long, format:"json"},
            });
            console.log(res.data.address);
            const city = res.data.address.town;
            const state = res.data.address.state;
            const country = res.data.address.country;
            const humanReadableLocation = city + ", " + state + ", " + country;
            setLocationInput(humanReadableLocation);
        } catch (error) {
            console.log("ERROR WITH REVERSE GEO CODE");
        }
    }

    if(mode == "Login"){
        return(
            <div>
            <h1>TouchGrass</h1>
            <form onSubmit= {(e) => {e.preventDefault(); handleLogin();}}>
                <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)}/>
                <input type="text" placeholder="Password" onChange={(e) => setPassword(e.target.value)}/>
                <button type="submit">LOG IN</button>
            </form>
            <p>Don't have an account yet?
                <button onClick={() => setMode("Register")}>SIGN UP</button>
            </p>
            </div>
        );
    }

    if(mode == "Register"){
    return(
            <div>
            <h1>Create Your Account</h1>
            <form onSubmit= {(e) => {e.preventDefault(); handleRegister();}}>
                <input type="text" placeholder="First Name" onChange={(e) => setfName(e.target.value)}/>
                <input type="text" placeholder="Last Name" onChange={(e) => setlName(e.target.value)}/>
                <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)}/>
                <input type="text" placeholder="Password" onChange={(e) => setPassword(e.target.value)}/>

                <input type="text" placeholder="Location" value={locationInput} onChange={(e) => setLocationInput(e.target.value)}/>
                <button type="button" onClick={handleGeolocation}>Use Current Location</button>
                <button type="button" onClick={handleManualLocationSearch}>Search Location</button>

                <button type="submit">SIGN UP</button>
            </form>
            <p>Already have an account?
                <button onClick={() => setMode("Login")}>Log in</button>
            </p>
            </div>
        );
    }
}