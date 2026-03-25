import React from "react";
import { Toaster } from "../ui/sonner";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <Navbar />

      <main className="flex-1 w-full  ">
        {children}
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
