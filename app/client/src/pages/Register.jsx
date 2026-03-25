import { use, useState } from "react";
import { registerUser, loginUser, parseError } from "../firebase";
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
            setError(parseError(err.code));
        }
    };


    //handle register
const handleRegister = async () => {
        console.log("HANDLE REGISTER CALLED CALLED");
        try{
            await registerUser(email, password, fName, lName, location);
            navigate("/home");
        } catch(err){
            setError(parseError(err.code));
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
                        coordinates: [lat, long] 
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

            setLocation({type: "Point", coordinates: [parseFloat(lat), parseFloat(lon)]});
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
            const city = res.data.address.city;
            const state = res.data.address.state;
            const country = res.data.address.country;
            const humanReadableLocation = city + ", " + state + ", " + country;
            setLocationInput(humanReadableLocation);
        } catch (error) {
            console.log("ERROR WITH REVERSE GEO CODE");
        }
    };

        return(
            <div className="flex h-screen w-full bg-emerald-950 overflow-hidden">
                <div className="flex flex-col justify-center w-1/2 px-16 gap-10 relative items-center">
                    <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-900 opacity-40 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-20 left-32 w-48 h-48 rounded-full bg-green-800 opacity-30 blur-2xl pointer-events-none" />  
                
                     <div className="relative z-10">
                       
                            <h1 className="text-6xl font-bold text-white leading-tight mb-2">
                        TouchGrass
                        </h1>

                        <div>
                             <p className="text-emerald-300 text-lg">
                        Get out there!
                        </p>
                        </div>
                       

                    </div>

                    <ul className="relative z-10 flex flex-col gap-8 justify-items-center">
                            {[
                            { icon: "🌱", title: "Discover local activities", desc: "Find hidden gems near you." },
                            { icon: "🤝", title: "Connect with others", desc: "Meet people looking to get out of their comfort zones." },
                            { icon: "📍", title: "Plan group adventures", desc: "Invite friends and organize outings easily." },
                            ].map(({ icon, title, desc }) => (
                            <li key={title} className="flex gap-7 items-start">
                                <span className="text-2xl mt-0.5">{icon}</span>
                                <div>
                                <p className="text-white font-medium text-sm">{title}</p>
                                <p className="text-emerald-400 text-sm">{desc}</p>
                                </div>
                            </li>
                            ))}
                        </ul>
   
                </div>


                 <div className="flex items-center justify-center w-1/2 py-8 pr-12">
                <div className="bg-white rounded-3xl w-full max-w-md flex flex-col  px-10 py-12 shadow-2xl min-h-[88vh]:">
 
          <div className="flex bg-emerald-50 rounded-xl p-1 mb-10 border border-emerald-100">
            <button
              onClick={() => setMode("Login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "Login"
                  ? "bg-emerald-700 shadow text-white"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode("Register")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "Register"
                  ? "bg-emerald-700 shadow text-white"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              Sign Up
            </button>
          </div>
          {mode === "Login" ? (
                 <><form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); } }>
                    <label className="text-sm font-medium text-slate-600 ">Email</label>
                    <div>
                        <input type="text" placeholder="you@example.com" 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <label className="text-sm font-medium text-slate-600">Password</label>
                    <div>
                        <input type="text" placeholder="Password" 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setPassword(e.target.value)} />
                    </div>
                            
                            {error && <p style={{ color: "red" }}>{error}</p>}
                            <button className="mt-4 bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors" type="submit">LOG IN</button>
                        </form></>
            ): (
                    <>
           
            <form className="flex flex-col gap-4" onSubmit= {(e) => {e.preventDefault(); handleRegister();}}>
                <div className="flex gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-sm font-medium text-slate-600">First Name</label>
                        <input type="text" placeholder="First"
                        className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                         onChange={(e) => setfName(e.target.value)}/>
                    </div>
              

                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-sm font-medium text-slate-600">Last Name</label>
                        <input type="text" placeholder="Last" 
                        className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setlName(e.target.value)}/>
                    </div>

                </div>


                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    <input type="text" placeholder="you@example.com" 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-600">Password</label>
                    <input type="text" placeholder="Password" 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setPassword(e.target.value)} />
                </div>

                    <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-600">Location</label>
                    <input type="text" placeholder="Location" 
                     className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={locationInput} onChange={(e) => setLocationInput(e.target.value)}/>

                    <div className="flex flex-row gap-1.5">
                    <button className="w-1/2 mt-4 bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors" type="button" onClick={handleGeolocation}>Use Current Location</button>
                <button className="w-1/2 mt-4 bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors" type="button" onClick={handleManualLocationSearch}>Search Location</button>
                </div>
                    
                </div>
                
                
                

                {error && <p style={{color: "red"}}>{error}</p>}
                <button className="mt-4 bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors" type="submit">CREATE ACCOUNT</button>
            </form>
             
            </>
            )}
                
            

    

                   
    </div>

                    
            </div>
            </div>
            
        );
    }

    
