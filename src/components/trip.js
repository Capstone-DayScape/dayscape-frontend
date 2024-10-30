import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Box, Typography, Card, CardContent, TextField, FormControl, Stack, Chip } from "@mui/material";
import AddDayDialog from "./add-day-dialog"; // Import the AddDayDialog component
import dayjs from "dayjs";
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import config from "../config";

var trip_id = "";

const SaveTripButton = ({ tripData, tripName }) => {
    const [icon, setIcon] = useState('💾');
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
	// Reset the icon back to the floppy disk when tripData or
	// tripName change
	setIcon('💾');
    }, [tripData, tripName]);

    const handleSave = async () => {
	try {
	    const accessToken = await getAccessTokenSilently();
	    const headers = {
		Authorization: `Bearer ${accessToken}`,
		"Content-Type": "application/json"
	    };

	    var response;
	    if (trip_id) {
		response = await axios.post(config.backend_endpoint +`/api/private/save_trip?trip_name=` + tripName + '&trip_id=' + trip_id, tripData, { headers });
	    } else {
		response = await axios.post(config.backend_endpoint +`/api/private/save_trip?trip_name=` + tripName, tripData, { headers });
	    }

	    if (response.status === 200) {
		console.log("Saved trip with id: ", response.data);
		setIcon('✅');
		trip_id = response.data;
	    }
	} catch (error) {
	    console.error("Error saving trip: ", error);
	}
    };

    return (
	<button onClick={handleSave}>{icon}</button>
    );
};

const libraries = ["places", "marker"];
const MIN_DESTINATIONS_PER_DAY = 3;
export const MAX_DESTINATIONS_PER_DAY = 5;

const Trip = () => {
    const [tripData, setTripData] = useState(JSON.parse(window.sessionStorage.getItem("data")));
    const [mapCenter, setMapCenter] = useState({ lat: -34.397, lng: 150.644 });
    const [days, setDays] = useState([
        { placeResponses: [], markers: [], routePath: [], travelTimes: [], durations: {}, notes: {} }
    ]);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const polylineRef = useRef(null);
    const mapRef = useRef(null);
    const [tripName, setTripName] = useState(tripData.name ? tripData.name : "Untitled Trip");
    const [isEditingName, setIsEditingName] = useState(false); // Track if we're editing the name
    // useEffect(() => {
    // 	console.log("Trip Data:", tripData);
    // 	console.log("Trip Name:", tripName);
    // }, [tripData, tripName]);


    const handleNameClick = () => {
	// Enable name editing mode
	setIsEditingName(true);
    };

    const handleNameChange = (e) => {
	// Update trip name as user types
	setTripName(e.target.value);
    };

    const handleNameBlur = () => {
	// Disable editing mode and indicate the change
	setIsEditingName(false);
    };

    /**
     * Handles events after the Google Maps API has loaded.
     */
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

    /**
     * Sets information for the first marker and sets the map center.
     */
    const getData = () => {
        if (tripData) {
            const location = {
                lat: tripData.startingLocation.latitude || 0,
                lng: tripData.startingLocation.longitude || 0
            };
            setMapCenter(location); // Center the map on the selected location
            setDays([
                {
                    markers: [
                        {
                            position: location,
                            label: "1",
                            name: tripData.startingLocation.name,
                            info: tripData.startingLocation.address,
                            rating: tripData.startingLocation.user_ratings_total || "N/A"
                        }
                    ],
                    routePath: [],
                    travelTimes: [],
                    durations: {},
                    notes: {},
                    placeResponses: []
                }
            ]);
            fetchNearbyPlaces(location, 0, false); // Fetch nearby places for the first day
        } else {
            console.error("Couldn't load data from session storage!");
        }
    };

    /**
     * Sends a request to the Google Maps Places API to fetch nearby places. Updates the current day destinations. Adds
     * markers for each destination and sets duration at each location.
     * @param {{lat:number, lng:number}} location Starting location
     * @param {number} dayIndex Index of the current day
     * @param {boolean} usePrevStops Whether to use previous stops for this day
     */
    const fetchNearbyPlaces = (location, dayIndex, usePrevStops) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error("Google Maps Places API is not loaded.");
            return;
        }

        let requestLeft = tripData.days[dayIndex].dayTags.length;

        const service = new window.google.maps.places.PlacesService(document.createElement("div"));
        const tags = tripData.days[dayIndex].dayTags;
        const responses = [];

        tags.forEach((tag) => {
            const request = {
                location,
                radius: 5000,
                type: tag,
                rankBy: window.google.maps.places.RankBy.PROMINENCE
            };

            // Makes the request to fetch nearby places
            service.nearbySearch(request, (results, status) => {
                const numTags = tripData.days[dayIndex].dayTags.length;

                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    const sortedResults = results.sort((a, b) => b.rating - a.rating);

                    responses.push({
                        tag: tag,
                        results: sortedResults,
                        resultIndex: 0
                    });
                } else {
                    console.error("PlacesServiceStatus not OK:", status);
                }

                // Last request
                if (requestLeft === 1) {
                    if (!usePrevStops) {
                        for (let i = 0; i < responses.length; i++) {
                            const usedPlaces = new Set(days.flatMap((day) => day.markers.map((marker) => marker.name)));
                            responses[i].results = responses[i].results.filter((place) => !usedPlaces.has(place.name));
                            responses[i].resultIndex = 0;
                        }
                    }

                    if (numTags < MIN_DESTINATIONS_PER_DAY) {
                        const newDestinations = [];

                        // Extracts new destinations from placesResponse
                        for (let i = 0; i < MIN_DESTINATIONS_PER_DAY; i++) {
                            const responseIdx = i % responses.length;
                            newDestinations.push({
                                tag: responses[responseIdx].tag,
                                destination: responses[responseIdx].results[responses[responseIdx].resultIndex]
                            });
                            responses[responseIdx].resultIndex++;
                        }

                        try {
                            const newMarkers = newDestinations.map((place, index) => ({
                                position: {
                                    lat: place.destination.geometry.location.lat(),
                                    lng: place.destination.geometry.location.lng()
                                },
                                label: `${index + 2}`,
                                type: place.tag,
                                types: place.destination.types,
                                name: place.destination.name,
                                info: place.destination.vicinity,
                                rating: place.destination.user_ratings_total,
                                duration: { hours: 2, minutes: 0 }
                            }));

                            setDays((prevDays) => {
                                const updatedDays = [...prevDays];
                                updatedDays[dayIndex].markers = [updatedDays[dayIndex].markers[0], ...newMarkers];
                                updatedDays[dayIndex].placeResponses = responses;
                                updatedDays[dayIndex].durations = {
                                    ...updatedDays[dayIndex].durations,
                                    ...newMarkers.reduce((acc, marker) => {
                                        acc[marker.name] = { hours: 2, minutes: 0 };
                                        return acc;
                                    }, {})
                                };
                                return updatedDays;
                            });
                            calculateRoute(location, newMarkers, dayIndex);
                        } catch (error) {
                            console.error(`newDestinations has undefined properties: ${error.message}`);
                        }
                    } else if (numTags > MAX_DESTINATIONS_PER_DAY) {
                        // Should not happen unless backend sends over MAX_DESTINATIONS_PER_DAY
                        console.log("Received too many destinations.");
                    } else {
                        const newDestinations = [];

                        responses.forEach((response) => {
                            newDestinations.push({
                                tag: response.tag,
                                destination: response.results[response.resultIndex]
                            });
                            response.resultIndex++;
                        });

                        try {
                            const newMarkers = newDestinations.map((place, index) => ({
                                position: {
                                    lat: place.destination.geometry.location.lat(),
                                    lng: place.destination.geometry.location.lng()
                                },
                                label: `${index + 2}`,
                                type: place.tag,
                                types: place.destination.types,
                                name: place.destination.name,
                                info: place.destination.vicinity,
                                rating: place.destination.user_ratings_total,
                                duration: { hours: 2, minutes: 0 }
                            }));

                            setDays((prevDays) => {
                                const updatedDays = [...prevDays];
                                updatedDays[dayIndex].markers = [updatedDays[dayIndex].markers[0], ...newMarkers];
                                updatedDays[dayIndex].placeResponses = responses;
                                updatedDays[dayIndex].durations = {
                                    ...updatedDays[dayIndex].durations,
                                    ...newMarkers.reduce((acc, marker) => {
                                        acc[marker.name] = { hours: 2, minutes: 0 };
                                        return acc;
                                    }, {})
                                };
                                return updatedDays;
                            });
                            calculateRoute(location, newMarkers, dayIndex);
                        } catch (error) {
                            console.error(`newDestinations has undefined properties: ${error.message}`);
                        }
                    }
                }
                requestLeft--;
            });
        });
    };

    /**
     * Calculates the route between the starting location and the given destinations for the current day index. Sets
     * the polyline path on the map.
     * @param {{lat:number, lng:number}} origin Starting location
     * @param {{duration: {hours: number, minutes: number}, name: *, rating: *, position: {lng: *, lat: *}, label: string, info: *}[]} places
     * List of destinations
     * @param {number} dayIndex Current day index
     */
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
            destination: waypoints[waypoints.length - 1].location,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsService
            .route(request, (result, status) => {
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
                    throw new Error(`Route calculation failed: ${status}`);
                }
            })
            .catch((error) => {
                console.error(error);
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

    /**
     * Calculates and returns the total trip duration for the selected day.
     * @returns {string} Total trip duration in hours and minutes
     */
    const calculateTotalTripDuration = () => {
        let totalMinutes = 0;
        const durations = days[selectedDayIndex].durations;
        const travelTimes = days[selectedDayIndex].travelTimes;

        Object.entries(durations).forEach(([_, duration]) => {
            const locationMinutes = (parseInt(duration.hours) || 0) * 60 + (parseInt(duration.minutes) || 0);
            totalMinutes += locationMinutes;
        });

        travelTimes.forEach((time) => {
            const [value, unit] = time.split(" ");
            let travelMinutes = 0;
            if (unit.includes("hour")) {
                travelMinutes = parseInt(value) * 60;
            } else if (unit.includes("min")) {
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

    /**
     * Saves the new day data to the session storage and updates the map accordingly.
     * @param {{ date:dayjs.Dayjs, tags:string[], transportMode:string, usePrevStops:boolean }} newDay
     */
    const handleSaveDay = (newDay) => {
        const newDayIndex = days.length;
        const newDayData = {
            markers: [
                {
                    position: mapCenter,
                    label: "1",
                    name: tripData.startingLocation.name,
                    info: tripData.startingLocation.address,
                    rating: tripData.startingLocation.user_ratings_total || "N/A"
                }
            ],
            routePath: [],
            travelTimes: [],
            durations: {},
            notes: {},
            placeResponses: []
        };

	// Need to reset tripData object so the saveButton detects a
	// change
	const newTripData = {
	   ...tripData, // Copy other properties
	   days: [
	       ...tripData.days, // Copy existing days
	       {
		   index: days.length,
            dayTags: newDay.tags,
            routeStops: [],
            usePreviousStops: newDay.usePrevStops,
            transportationMode: newDay.transportMode
	       }
	   ]
       };

        window.sessionStorage.setItem("data", JSON.stringify(newTripData));
	setTripData(newTripData);

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
            // Remove the existing polyline from the map
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }

            // Add the polyline for the selected day
            if (daysRef.current[selectedDayIndex].routePath.length > 0 && mapRef.current) {
                polylineRef.current = new window.google.maps.Polyline({
                    path: daysRef.current[selectedDayIndex].routePath,
                    strokeColor: "#DD0066",
                    strokeOpacity: 0.75,
                    strokeWeight: 6
                });
                polylineRef.current.setMap(mapRef.current);
            }
        };

        renderPolyline();
    }, [selectedDayIndex, days]); // Run when selectedDayIndex or days changes

    useEffect(() => {
        // Unselect any selected node when switching days
        setSelectedNode(null);
    }, [selectedDayIndex]); // Run only when selectedDayIndex changes

    return (
        <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={handleLoad}>
            <Stack direction="column">
		<Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
		    {isEditingName ? (
			<TextField
			    variant="outlined"
			    value={tripName}
			    onChange={handleNameChange}
			    onBlur={handleNameBlur} // Save the name when input loses focus
			    autoFocus
			/>
		    ) : (
			<Typography variant="h2" onClick={handleNameClick} style={{ cursor: "pointer" }}>
			    {tripName}
			</Typography>
		    )}
		    <SaveTripButton tripData={tripData} tripName={tripName} />

		</Box>
                <Box display="flex" alignItems="center" justifyContent="center" mb={4} mt={3}>
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
                                        cursor: "pointer"
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
                <Stack direction="row">
                    <Box
                        width="25%"
                        padding="10px"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        overflow="auto"
                        mr={4}>
                        {days[selectedDayIndex].markers.map(
                            (marker, index) =>
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
                        )}
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
                            {days[selectedDayIndex].markers.map(
                                (marker, index) =>
                                    marker && (
                                        <Marker
                                            key={index}
                                            position={marker.position}
                                            label={marker.label}
                                            onClick={() =>
                                                setSelectedNode(selectedNode?.name === marker.name ? null : marker)
                                            }
                                        />
                                    )
                            )}
                        </GoogleMap>
                        {selectedNode && (
                            <Card mt={2} p={2} sx={{ minHeight: "400px", width: "100%", mt: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {selectedNode.name}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom sx={{ mt: -0.75, mb: 2, color: "gray" }}>
                                        {selectedNode.info}
                                    </Typography>
                                    {selectedNode.types && (
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                                            <Typography variant="body1" sx={{ mt: 1 / 2 }}>
                                                Types:
                                            </Typography>
                                            {selectedNode.types.map((tag, index) => (
                                                <Chip
                                                    // variant={selectedNode.type === tag ? "filled" : "outlined"}
                                                    variant="outlined"
                                                    color={selectedNode.type === tag ? "primary" : "default"}
                                                    label={tag}
                                                    key={index}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                    {selectedNode.label !== "1" && (
                                        <>
                                            <FormControl fullWidth variant="outlined" margin="normal">
                                                <Typography variant="body1">Duration:</Typography>
                                                <Box display="flex">
                                                    <TextField
                                                        label="Hours"
                                                        type="number"
                                                        variant="outlined"
                                                        margin="normal"
                                                        value={
                                                            days[selectedDayIndex].durations[selectedNode.name]?.hours
                                                        }
                                                        onChange={handleHoursChange}
                                                        style={{ marginRight: "10px" }}
                                                        slotProps={{ htmlInput: { min: 0 } }}
                                                    />
                                                    <TextField
                                                        label="Minutes"
                                                        type="number"
                                                        variant="outlined"
                                                        margin="normal"
                                                        value={
                                                            days[selectedDayIndex].durations[selectedNode.name]?.minutes
                                                        }
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
                </Stack>
            </Stack>
            <AddDayDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveDay}
                startingLocation={tripData.startingLocation.name}
                previousDayDate={dayjs().format("YYYY-MM-DD")}
            />
        </LoadScript>
    );
};

export default Trip;
