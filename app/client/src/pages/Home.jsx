import {logOut} from "../firebase"
import { Navigate, useNavigate } from "react-router-dom"

export default function Home(){
    const navigate = useNavigate();

    const handleLogOut = async() => {
            await logOut();
            navigate("/");
        };

    const goToActivities = () => {
        navigate("/activities");
    };

    const goToSettings = () => {
        navigate("/settingsandpreferences");
    };
    const goToCommunity = () => {
        navigate("/community");
    };

    return(
        <div className="min-h-screen bg-linear-to-b from-green-50 to-blue-50 py-8 px-4">
            <div className="mb-8">
                <button type="button" onClick={handleLogOut} className="w-50 bg-red-200 border-red-200 text-red-500 rounded-xl py-3 text-sm font-medium hover:bg-red-50 transition-colors">Log Out</button>
            </div>

<<<<<<< HEAD
            <button type="button" onClick={handleLogOut}>LOG OUT</button>
            <button type="button" onClick={goToActivities}>ACTIVITIES</button>
            <button type="button" onClick={goToSettings}>Settings and Preferences</button>
            <button onClick={goToCommunity}>Community</button>
=======
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Activities</h2>
                    <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGlraW5nfGVufDB8fDB8fHww" alt="Activities" className="w-full h-48 object-cover rounded mb-4" />
                    <p className="text-gray-600 mb-4">Explore and discover outdoor activities in your area.</p>
                    <button type="button" onClick={goToActivities} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Go to Activities</button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Settings and Preferences</h2>
                    <img src="https://www.freeiconspng.com/uploads/settings-icon-13.png" alt="Settings and Preferences" className="w-full h-48 object-cover rounded mb-4" />
                    <p className="text-gray-600 mb-4">Customize your account settings and preferences.</p>
                    <button type="button" onClick={goToSettings} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Go to Settings</button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Community</h2>
                    <img src="https://img.freepik.com/free-photo/people-stacking-hands-together-park_53876-63293.jpg?semt=ais_hybrid&w=740&q=80" alt="Community" className="w-full h-48 object-cover rounded mb-4" />
                    <p className="text-gray-600 mb-4">Connect with other users and share your experiences.</p>
                    <button onClick={goToCommunity} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Go to Community</button>
                </div>
            </div>
>>>>>>> 05591654bcadc7ac8dbfc995c8b356fb23d7dbd0
        </div>
    );
}