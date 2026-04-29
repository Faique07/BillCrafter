import React from "react";
import Home from "./pages/Home.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import AppShell from "./components/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const ClerkProtected = ({ children }) => (
  <>
    <SignedIn>
      {children}
    </SignedIn>

    <SignedOut>
      <RedirectToSignIn/>
    </SignedOut>
  </>
)

const App = () => {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Routes>
      <Route path="/" element={<Home/>}/>
      {/* it must be protected route */}
      <Route
        path="/app"
        element={
          <ClerkProtected>
            <AppShell/>
          </ClerkProtected>
        }
      >
        <Route index element= {<Dashboard/>}/>
        <Route path="dashboard" element={<Dashboard/>  }/>
      </Route>
    </Routes>
    </div>
  );
};

export default App;
