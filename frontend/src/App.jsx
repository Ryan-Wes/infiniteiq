import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./pages/Hero";
import Dashboard from "./pages/Dashboard";
import Agent from "./pages/Agent";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agent" element={<Agent />} />
      </Routes>
    </BrowserRouter>
  );
}
