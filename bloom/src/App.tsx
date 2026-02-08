//@ts-nocheck
import { Routes, Route } from "react-router";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import GenerateProfile from "./Components/GenerateProfile";
import { useAuth } from "./contexts/AuthContext";
import LoginMe from "./Components/LoginMe";
import MyProfile from "./Components/MyProfile";
// ProtectedRoute.tsx (or inline)
import { Navigate } from "react-router";
import './App.css'; 
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? children : <Navigate to="/login/me" replace />;
};
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Navigate to="/login/me" replace /> :               <Home />
;
};




const App = () => {
  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
       from-[#700912] via-[#c4505a] to-[#dd908c]
        text-[#4a2c2a] no-scrollbar
      "
    >
      <Routes>
  <Route path="/" element={<RootRoute />} />        <Route path="/login" element={<Login />} />
        <Route
          path="/login/me"
          element={<LoginMe />}
        />
        <Route
          path="/generate-profile"
          element={
            <ProtectedRoute>
              <GenerateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
