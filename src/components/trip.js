import React, { useState } from "react";
import { GoogleMap, LoadScript, Polyline, Marker } from "@react-google-maps/api";
import { Box, Typography, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

// Load the necessary libraries for Google Maps
const libraries = ["places", "marker"];
const data = JSON.parse(window.sessionStorage.getItem("data"));

const Trip = () => {
    const [mapCenter, setMapCenter] = useState({ lat: -34.397, lng: 150.644 });
    const [routePath, setRoutePath] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [travelTimes, setTravelTimes] = useState([]); // State to store travel times
    const [selectedNode, setSelectedNode] = useState(null);
    const [notes, setNotes] = useState(""); // State to store notes
    const [durations, setDurations] = useState({}); // State to store durations

    const handleLoad = () => {
        const loadGoogleMaps = async () => {
            if (window.google && window.google.maps) {
                console.log("Google Maps JavaScript API loaded successfully.");
            } else {
                console.error("Google Maps JavaScript API is not loaded.");
            }
        };
        loadGoogleMaps().then(() => {
            setTimeout(getData, 1); // Fixes first marker not appearing
        });
    };

    const getData = () => {
        if (data) {
            const location = {
                lat: data.startingLocation.latitude || 0,
                lng: data.startingLocation.longitude || 0
            };
            setMapCenter(location); // Center the map on the selected location
            setMarkers([{
                position: location,
                label: "1",
                name: data.startingLocation.name,
                info: data.startingLocation.address,
                rating: data.startingLocation.user_ratings_total || "N/A",
            }]);
            fetchNearbyPlaces(location); // Fetch nearby places based on the selected location
        } else {
            console.error("Couldn't load data from session storage!");
        }
    };

    // Fetch nearby places using the Google Places API
    const fetchNearbyPlaces = (location) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error("Google Maps Places API is not loaded.");
            return;
        }

        const service = new window.google.maps.places.PlacesService(document.createElement("div")); // Create a new PlacesService instance
        const request = {
            location,
            radius: "5000", // Search within a 5000-meter radius
            type: ["restaurant"], // This is probably how we will filter out the places we want to visit by trip preferences
            rankBy: window.google.maps.places.RankBy.PROMINENCE // Rank results by prominence
        };

        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                // Sort results by rating and take the top 3
                const sortedResults = results.sort((a, b) => b.rating - a.rating).slice(0, 3);

                // Set markers for the nearby places
                const newMarkers = sortedResults.map((place, index) => ({
                    position: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
                    label: `${index + 2}`, // Start numbering from 2 since 1 is the initial location
                    name: place.name, // Set the name of the place
                    info: place.vicinity, // Set the info of the place
                    rating: place.user_ratings_total, // Set the prominence (user ratings total) of the place
                    duration: { hours: 2, minutes: 0 } // Default duration
                }));
                setMarkers((prevMarkers) => [...prevMarkers, ...newMarkers]); // Add new markers to the existing ones

                // Set default durations for the new markers
                const newDurations = sortedResults.reduce((acc, place) => {
                    acc[place.name] = { hours: 2, minutes: 0 };
                    return acc;
                }, {});
                setDurations((prevDurations) => ({ ...prevDurations, ...newDurations }));

                calculateRoute(location, sortedResults); // Calculate the route including these places
            } else {
                console.error("PlacesServiceStatus not OK:", status);
            }
        });
    };

    // Calculate the route between the selected location and the nearby places
    const calculateRoute = (origin, places) => {
        const directionsService = new window.google.maps.DirectionsService(); // Create a new DirectionsService instance
        const waypoints = places.map((place) => ({
            location: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }, // Convert place geometry to lat/lng
            stopover: true // Indicate that these are stopover points
        }));

        const request = {
            origin,
            destination: waypoints[waypoints.length - 1].location, // Set the last waypoint as the destination
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING // Set the travel mode to driving
        };

        directionsService
            .route(request, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    // Convert the route to an array of lat/lng points
                    const route = result.routes[0].overview_path.map((point) => ({
                        lat: point.lat(),
                        lng: point.lng()
                    }));
                    setRoutePath(route); // Update state with the route path

                    // Extract travel times from the directions result
                    const times = result.routes[0].legs.map((leg) => leg.duration.text);
                    setTravelTimes(times); // Update state with the travel times
                }
            })
            .catch(() => console.error("Route Request Failed!"));
    };

    const handleNotesChange = (e) => {
        const { value } = e.target;
        setNotes((prevNotes) => ({
            ...prevNotes,
            [selectedNode.name]: value
        }));
    };

    const handleHoursChange = (e) => {
        const value = Math.max(0, e.target.value);
        setDurations((prevDurations) => ({
            ...prevDurations,
            [selectedNode.name]: {
                ...prevDurations[selectedNode.name],
                hours: value
            }
        }));
    };

    const handleMinutesChange = (e) => {
        const value = Math.max(0, e.target.value);
        setDurations((prevDurations) => ({
            ...prevDurations,
            [selectedNode.name]: {
                ...prevDurations[selectedNode.name],
                minutes: value
            }
        }));
    };

    const calculateTotalTripDuration = () => {
        let totalMinutes = 0;
    
        // Add durations spent at each location, excluding the initial destination
        Object.entries(durations).forEach(([name, duration], index) => {
            const locationMinutes = (parseInt(duration.hours) || 0) * 60 + (parseInt(duration.minutes) || 0);
            totalMinutes += locationMinutes;
        });
    
        // Add travel times between locations
        travelTimes.forEach(time => {
            const [value, unit] = time.split(' ');
            let travelMinutes = 0;
            if (unit.includes('hour')) {
                travelMinutes = parseInt(value) * 60;
            } else if (unit.includes('min')) {
                travelMinutes = parseInt(value);
            }
            totalMinutes += travelMinutes;
        });
    
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} hours and ${minutes} minutes`;
    };

    // noinspection JSValidateTypes
    return (
        <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={handleLoad}>
            <Box display="flex" height="80vh" alignItems="center" justifyContent="center">
                <Box
                    width="25%"
                    padding="10px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    overflow="auto"
                    mr={4}>
                    {markers.map((marker, index) => (
                        <Box
                            key={index}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            mb={2}
                            onClick={() => setSelectedNode(selectedNode?.name === marker.name ? null : marker)}
                            sx={{ cursor: "pointer" }}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                bgcolor={selectedNode?.name === marker.name ? "#4caf50" : "primary.main"}
                                color="white"
                                borderRadius="16px"
                                padding="10px"
                                width="100%"
                                minWidth="250px"
                                minHeight="50px"
                                textAlign="center"
                                boxShadow={3}>
                                <Typography variant="h6">{marker.name}</Typography>
                            </Box>
                            {index < markers.length - 1 && (
                                <Box display="flex" alignItems="center">
                                    <Box
                                        position="relative"
                                        width="2px"
                                        height="65px"
                                        bgcolor="#686879"
                                        mb={-2}
                                        sx={{
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                bottom: 0,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                borderLeft: "5px solid transparent",
                                                borderRight: "5px solid transparent",
                                                borderTop: "10px solid #686879"
                                            }
                                        }}
                                    />
                                    <Typography variant="body2" ml={2} color="#686879">
                                        {travelTimes[index]}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ))}
                    <Typography variant="body1" mt={2} align="center" color="#686879">
                        Total Time: {calculateTotalTripDuration()}
                    </Typography>
                </Box>
                <Box flex={1} display="flex" flexDirection="column" alignItems="center" width="75%">
                    <GoogleMap
                        id="map"
                        mapContainerStyle={{ height: "400px", width: "100%" }}
                        zoom={14}
                        center={mapCenter}
                        options={{ mapId: "651e26fab50abd83" }}>
                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                position={marker.position}
                                label={marker.label}
                                onClick={() => setSelectedNode(selectedNode?.name === marker.name ? null : marker)}
                            />
                        ))}
                        {routePath.length > 0 && (
                            <Polyline
                                path={routePath} // Set the path of the polyline
                                options={{
                                    strokeColor: "#DD0066",
                                    strokeOpacity: 0.75,
                                    strokeWeight: 6
                                }}
                            />
                        )}
                    </GoogleMap>
                    {selectedNode && (
                        <Card mt={2} p={2} sx={{ minHeight: '400px', width: '100%', mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {selectedNode.name}
                                </Typography>
                                <Typography variant="body1" gutterBottom sx={{ mt: -0.75, mb: 2, color: 'gray' }}>
                                    {selectedNode.info}
                                </Typography>
                                {selectedNode.label !== "1" && (
                                    <>
                                        <Typography variant="body1" gutterBottom>
                                            Prominence: {selectedNode.rating}
                                        </Typography>
                                        <FormControl fullWidth variant="outlined" margin="normal">
                                            <Typography variant="body1">
                                                Duration:
                                            </Typography>
                                            <Box display="flex">
                                                <TextField
                                                    label="Hours"
                                                    type="number"
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={durations[selectedNode.name]?.hours}
                                                    onChange={handleHoursChange}
                                                    style={{ marginRight: '10px' }}
                                                    slotProps={{ htmlInput: { min: 0 } }}
                                                />
                                                <TextField
                                                    label="Minutes"
                                                    type="number"
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={durations[selectedNode.name]?.minutes}
                                                    onChange={handleMinutesChange}
                                                    slotProps={{ htmlInput: { min: 0 } }}
                                                />
                                            </Box>
                                        </FormControl>
                                    </>
                                )}
                                <TextField
                                    label="Enter Notes"
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    fullWidth
                                    value={notes[selectedNode.name] || ""}
                                    onChange={handleNotesChange}
                                />
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>
        </LoadScript>
    );
};

export default Trip;