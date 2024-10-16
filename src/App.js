import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/home";
import About from "./components/about";
import Trip from "./components/trip";
import Layout from "./components/layout";
import CreateTrip from "./components/create-trip";
import LoginButton from "./components/login";
import LogoutButton from "./components/logout";
import Profile from "./components/profile";
import { useAuth0 } from "@auth0/auth0-react";

function App() {
const { isAuthenticated } = useAuth0();
    return (
	<Router>
	    <Layout>
		<Routes>
		    <Route path="/" element={<Home />} />
		    <Route path="/trip" element={<Trip />} />
		    <Route path="/about" element={<About />} />
		    <Route path="/create-trip" element={<CreateTrip />} />
		    {isAuthenticated ? (
			<>
			    <Route path="/logout" element={<LogoutButton />} />
			    <Route path="/profile" element={<Profile />} />
			</>
		    ) : (
			<Route path="/login" element={<LoginButton />} />
		    )}
		</Routes>
	    </Layout>
	</Router>
    );
}

export default App;
