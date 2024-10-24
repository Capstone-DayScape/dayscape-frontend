import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Box, Typography, Card, CardContent, TextField, FormControl } from "@mui/material";
import AddDayDialog from "./add-day-dialog"; // Import the AddDayDialog component
import dayjs from "dayjs";

const libraries = ["places", "marker", "geometry"];
const data = JSON.parse(window.sessionStorage.getItem("data"));

const Trip = () => {
    const [mapCenter, setMapCenter] = useState({ lat: -34.397, lng: 150.644 });
    const [days, setDays] = useState([{ markers: [], routePath: [], travelTimes: [], durations: {}, notes: {} }]);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const polylineRef = useRef(null);
    const mapRef = useRef(null);

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
            setDays([{ markers: [{ position: location, label: "1", name: data.startingLocation.name, info: data.startingLocation.address, rating: data.startingLocation.user_ratings_total || "N/A" }], routePath: [], travelTimes: [], durations: {}, notes: {} }]);
            fetchNearbyPlaces(location, 0, false); // Fetch nearby places for the first day
        } else {
            console.error("Couldn't load data from session storage!");
        }
    };

    const fetchNearbyPlaces = (location, dayIndex, usePrevStops) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error("Google Maps Places API is not loaded.");
            return;
        }

        const service = new window.google.maps.places.PlacesService(document.createElement("div"));
        const request = {
            location,
            radius: "5000",
            type: ["restaurant"],
            rankBy: window.google.maps.places.RankBy.PROMINENCE
        };

        const handleResults = (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                let sortedResults = results.sort((a, b) => b.rating - a.rating);

                if (!usePrevStops) {
                    const usedPlaces = new Set(days.flatMap(day => day.markers.map(marker => marker.name)));
                    sortedResults = sortedResults.filter(place => !usedPlaces.has(place.name));
                }

                const newMarkers = sortedResults.slice(0, 3).map((place, index) => ({
                    position: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
                    label: `${index + 2}`,
                    name: place.name,
                    info: place.vicinity,
                    rating: place.user_ratings_total,
                    duration: { hours: 2, minutes: 0 }
                }));

                setDays((prevDays) => {
                    const updatedDays = [...prevDays];
                    updatedDays[dayIndex].markers = [updatedDays[dayIndex].markers[0], ...newMarkers];
                    updatedDays[dayIndex].durations = {
                        ...updatedDays[dayIndex].durations,
                        ...newMarkers.reduce((acc, marker) => {
                            acc[marker.name] = { hours: 2, minutes: 0 };
                            return acc;
                        }, {})
                    };
                    return updatedDays;
                });

                if (newMarkers.length > 0) {
                    calculateRoute(location, newMarkers, dayIndex);
                } else {
                    console.warn("No new places found for the given criteria.");
                }
            } else {
                console.error("PlacesServiceStatus not OK:", status);
            }
        };

        service.nearbySearch(request, handleResults);
    };

    const calculateRoute = (origin, places, dayIndex) => {
        const directionsService = new window.google.maps.DirectionsService();
        const waypoints = places.map((place) => ({
            location: { lat: place.position.lat, lng: place.position.lng },
            stopover: true
        }));
    
        if (waypoints.length === 0) {
            console.warn("No waypoints found for the route.");
            return;
        }
    
        const request = {
            origin,
            destination: origin, // Set the destination to the origin to create a loop
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true // Optimize the order of waypoints to form a circular route
        };
    
        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                const route = result.routes[0].overview_path.map((point) => ({
                    lat: point.lat(),
                    lng: point.lng()
                }));
                const times = result.routes[0].legs.map((leg) => leg.duration.text);
                setDays((prevDays) => {
                    const updatedDays = [...prevDays];
                    updatedDays[dayIndex].routePath = route;
                    updatedDays[dayIndex].travelTimes = times;
                    return updatedDays;
                });
            } else {
                console.error("Route calculation failed:", status);
            }
        });
    };

    const handleNotesChange = (e) => {
        const { value } = e.target;
        setDays((prevDays) => {
            const updatedDays = [...prevDays];
            updatedDays[selectedDayIndex].notes[selectedNode.name] = value;
            return updatedDays;
        });
    };

    const handleHoursChange = (e) => {
        const value = Math.max(0, e.target.value);
        setDays((prevDays) => {
            const updatedDays = [...prevDays];
            if (!updatedDays[selectedDayIndex].durations[selectedNode.name]) {
                updatedDays[selectedDayIndex].durations[selectedNode.name] = { hours: 0, minutes: 0 };
            }
            updatedDays[selectedDayIndex].durations[selectedNode.name].hours = value;
            return updatedDays;
        });
    };

    const handleMinutesChange = (e) => {
        const value = Math.max(0, e.target.value);
        setDays((prevDays) => {
            const updatedDays = [...prevDays];
            if (!updatedDays[selectedDayIndex].durations[selectedNode.name]) {
                updatedDays[selectedDayIndex].durations[selectedNode.name] = { hours: 0, minutes: 0 };
            }
            updatedDays[selectedDayIndex].durations[selectedNode.name].minutes = value;
            return updatedDays;
        });
    };

    const calculateTotalTripDuration = () => {
        let totalMinutes = 0;
        const durations = days[selectedDayIndex].durations;
        const travelTimes = days[selectedDayIndex].travelTimes;

        Object.entries(durations).forEach(([name, duration]) => {
            const locationMinutes = (parseInt(duration.hours) || 0) * 60 + (parseInt(duration.minutes) || 0);
            totalMinutes += locationMinutes;
        });

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

    const handleAddDay = () => {
        setIsDialogOpen(true);
    };

    const handleSaveDay = (newDay) => {
        const newDayIndex = days.length;
        const newDayData = {
            markers: [{ position: mapCenter, label: "1", name: data.startingLocation.name, info: data.startingLocation.address, rating: data.startingLocation.user_ratings_total || "N/A" }],
            routePath: [],
            travelTimes: [],
            durations: {},
            notes: {}
        };

        fetchNearbyPlaces(mapCenter, newDayIndex, newDay.usePrevStops);

        setDays((prevDays) => [...prevDays, newDayData]);
        setSelectedDayIndex(newDayIndex);
        setIsDialogOpen(false);
    };

    const daysRef = useRef(days);

    useEffect(() => {
        daysRef.current = days;
    }, [days]);
    
    useEffect(() => {
        // Function to render the polyline
        const renderPolyline = () => {
            // Remove the existing polylines from the map
            if (polylineRef.current) {
                polylineRef.current.forEach(polyline => polyline.setMap(null));
                polylineRef.current = [];
            }
    
            // Add the polyline for the selected day
            if (daysRef.current[selectedDayIndex].routePath.length > 0 && mapRef.current) {
                const path = daysRef.current[selectedDayIndex].routePath;
                const colors = generateGradientColors(path.length - 1);
    
                polylineRef.current = path.slice(0, -1).map((point, index) => {
                    const segment = new window.google.maps.Polyline({
                        path: [point, path[index + 1]],
                        strokeColor: colors[index],
                        strokeOpacity: 1,
                        strokeWeight: 6
                    });
                    segment.setMap(mapRef.current);
                    return segment;
                });
            }
        };
    
        renderPolyline();
    
        // Cleanup function to remove the polylines when dependencies change
        return () => {
            if (polylineRef.current) {
                polylineRef.current.forEach(polyline => polyline.setMap(null));
                polylineRef.current = [];
            }
        };
    }, [selectedDayIndex, days[selectedDayIndex]?.routePath, mapRef]);
    
    useEffect(() => {
        // Unselect any selected node when switching days
        setSelectedNode(null);
    }, [selectedDayIndex]); // Run only when selectedDayIndex changes

    const generateGradientColors = (numColors) => {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const hue = Math.floor((300 * i) / (numColors - 1)); // Hue range
            colors.push(`hsl(${hue}, 100%, 50%)`); // Full saturation and 50% lightness
        }
        return colors;
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={handleLoad}>
            <Box display="flex" flexDirection="column" height="80vh" alignItems="center" justifyContent="center">
                <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <Box display="flex" alignItems="center">
                        {days.map((_, index) => (
                            <React.Fragment key={index}>
                                <Box
                                    onClick={() => setSelectedDayIndex(index)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        backgroundColor: selectedDayIndex === index ? "#4caf50" : "#1976d2",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        cursor: "pointer",
                                    }}>
                                    {index + 1}
                                </Box>
                                {index < days.length - 1 && (
                                    <Box
                                        sx={{
                                            width: 35,
                                            height: 2,
                                            backgroundColor: "#686879"
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                            <Box
                                sx={{
                                    width: 35,
                                    height: 2,
                                    backgroundColor: "#686879"
                                }}
                            />
                            <Box
                            onClick={handleAddDay}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: "#777777",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                cursor: "pointer"
                            }}>
                            +
                        </Box>
                    </Box>
                </Box>
                <Box display="flex" height="100%" width="100%" alignItems="center" justifyContent="center">
                    <Box
                        width="25%"
                        padding="10px"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        overflow="auto"
                        mr={4}>
                        {days[selectedDayIndex].markers.map((marker, index) => (
                            marker && (
                                <Box
                                    key={index}
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    mb={2}
                                    onClick={() => {
                                        setSelectedNode(selectedNode?.name === marker.name ? null : marker);
                                    }}
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
                                    {index < days[selectedDayIndex].markers.length - 1 && (
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
                                                {days[selectedDayIndex].travelTimes[index]}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )
                        ))}
                        <Typography variant="body1" mt={2} align="center" color="#686879">
                            Total Time: {calculateTotalTripDuration()}
                        </Typography>
                    </Box>
                    <Box flex={1} display="flex" flexDirection="column" alignItems="center" width="75%">
                        <GoogleMap
                            id="map"
                            onLoad={(map) => {
                                mapRef.current = map;
                            }}
                            mapContainerStyle={{ height: "400px", width: "100%" }}
                            zoom={14}
                            center={mapCenter}
                            options={{ mapId: "651e26fab50abd83" }}>
                            {days[selectedDayIndex].markers.map((marker, index) => (
                                marker && (
                                    <Marker
                                        key={index}
                                        position={marker.position}
                                        label={marker.label}
                                        onClick={() => setSelectedNode(selectedNode?.name === marker.name ? null : marker)}
                                    />
                                )
                            ))}
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
                                                        value={days[selectedDayIndex].durations[selectedNode.name]?.hours}
                                                        onChange={handleHoursChange}
                                                        style={{ marginRight: '10px' }}
                                                        slotProps={{ htmlInput: { min: 0 } }}
                                                    />
                                                    <TextField
                                                        label="Minutes"
                                                        type="number"
                                                        variant="outlined"
                                                        margin="normal"
                                                        value={days[selectedDayIndex].durations[selectedNode.name]?.minutes}
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
                                        value={days[selectedDayIndex].notes[selectedNode.name] || ""}
                                        onChange={handleNotesChange}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </Box>
            </Box>
            <AddDayDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveDay}
                startingLocation={data.startingLocation.name}
                previousDayDate={dayjs().format('YYYY-MM-DD')}
            />
        </LoadScript>
    );
};

export default Trip;