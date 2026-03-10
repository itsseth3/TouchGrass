import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./pages/Login.jsx"

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
      </Routes>
    </BrowserRouter>
      
  )
}

export default App
