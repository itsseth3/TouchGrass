import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Register from "./pages/Register"
import Home from "./pages/Home"
import Activities from "./pages/Activities"
import SettingsPrefs from "./pages/SettingsPrefs"

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/activities" element={<Activities/>}/>
        <Route path="/settingsandpreferences" element={<SettingsPrefs/>}/>
      </Routes>
    </BrowserRouter>
      
  )
}

export default App
