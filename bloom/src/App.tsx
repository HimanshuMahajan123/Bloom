import React from 'react'
import Home from './Components/Home'
import GenerateProfile from './Components/GenerateProfile'
import './App.css'
// import Login from './Components/Login'
import HeartLoader from './Components/HeartLoader'
import Dashboard from './Components/Dashboard'
const App = () => {
  return (
    <div  className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
        from-[##923b42]
        via-[#e8afa8]
        to-[#d38f8c]
        text-[#4a2c2a]
      ">
        <Dashboard />
        {/* <PhysicsScene /> */}
      </div>
  )
}

export default App