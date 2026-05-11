import React from "react";
import Home from "./pages/Home.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import AppShell from "./components/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateInvoice from "./pages/CreateInvoice.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoicePreview from "./components/InvoicePreview.jsx";

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
        <Route path="invoices" element={<Invoices/>}/>
        <Route path="invoices/new" element={<CreateInvoice/>}/>
        <Route path="invoices/:id" element={<InvoicePreview/>}/>
        <Route path="invoices/:id/preview" element={<InvoicePreview/>}/>
        <Route path="invoices/:id/edit" element={<CreateInvoice/>}/>

        <Route path="create-invoice" element={<CreateInvoice/>}/>
      </Route>
    </Routes>
    </div>
  );
};

export default App;
