import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Dashboard from "./components/Dashboard";
import DebateRoom from "./components/DebateRoom";
import Leaderboard from "./components/Leaderboard";
import HistoryList from "./components/HistoryList";
import NotFound from "./pages/NotFound";

import { loginUser, signupUser, getCurrentUser, logoutUser } from "./lib/authService";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserName(currentUser.name);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    loginUser(email, password);
    const user = getCurrentUser();
    setUserName(user.name);
    setIsLoggedIn(true);
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    signupUser(name, email, password);
    setUserName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setUserName("User");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <Routes>
              <Route
                path="/login"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginForm onLogin={handleLogin} />
                  )
                }
              />

              <Route
                path="/signup"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <SignupForm onSignup={handleSignup} />
                  )
                }
              />

              <Route
                path="/dashboard"
                element={
                  isLoggedIn ? (
                    <Dashboard userName={userName} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/debate/:topicId"
                element={isLoggedIn ? <DebateRoom /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/leaderboard"
                element={isLoggedIn ? <Leaderboard /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/history"
                element={isLoggedIn ? <HistoryList /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/"
                element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
