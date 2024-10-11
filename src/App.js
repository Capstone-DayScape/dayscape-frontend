import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import About from "./components/about";
import Trip from "./components/trip";
import Layout from "./components/layout";
import CreateTrip from "./components/create-trip";
import Profile from "./components/profile";

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/trip" element={<Trip />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/create-trip" element={<CreateTrip />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
