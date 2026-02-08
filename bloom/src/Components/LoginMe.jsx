import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

const LoginMe = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && user.onboardingCompleted) {
        navigate("/app" , { replace: true });
      } else if(user && user.verified && !user.onboardingCompleted) {
        navigate("/generate-profile", { replace: true });
      }
      else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading]);

  return <p>Igniting your spark… ✨</p>;
};

export default LoginMe;
