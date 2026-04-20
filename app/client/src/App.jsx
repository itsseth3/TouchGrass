import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Register from "./pages/Register";
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import SettingsPrefs from "./pages/SettingsPrefs";
<<<<<<< HEAD
import CommunityPage from "./pages/CommunityPage";
=======
import CommunityPage from "./pages/Community";
import CreatePost from "./pages/CreatePost";
>>>>>>> 05591654bcadc7ac8dbfc995c8b356fb23d7dbd0

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/activities" element={<Activities />} />
<<<<<<< HEAD
=======
                <Route path="/posts/create" element={<CreatePost />} />
>>>>>>> 05591654bcadc7ac8dbfc995c8b356fb23d7dbd0
                <Route path="/settingsandpreferences" element={<SettingsPrefs />} />
                <Route path="/community" element={<CommunityPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;