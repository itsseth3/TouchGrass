import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Register from "./pages/Register";
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import SettingsPrefs from "./pages/SettingsPrefs";
import CommunityPage from "./pages/CommunityPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/settingsandpreferences" element={<SettingsPrefs />} />
                <Route path="/community" element={<CommunityPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;