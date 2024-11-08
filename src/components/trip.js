import { useAuth0 } from "@auth0/auth0-react";
import CallIcon from "@mui/icons-material/Call";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import PublicIcon from "@mui/icons-material/Public";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from 'react-router-dom';
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import config from "../config";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from 'axios';
import SyncIcon from "@mui/icons-material/Sync";

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    IconButton,
    Paper,
    Rating,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Alert
} from "@mui/material";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
import dayjs from "dayjs";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getTrip, saveTrip } from "../api";
import AddDayDialog from "../components/add-day-dialog"; // Import the AddDayDialog component
import NodeInfoDialog from "../components/node-info-dialog"; // Import the NodeInfoDialog component
import { MAX_DESTINATIONS_PER_DAY, MIN_DESTINATIONS_PER_DAY } from "./constants";
import "./styles/trip.css";
import "./styles/styles.css";

const libraries = ["places", "marker", "geometry"];

const existingTripData = JSON.parse(localStorage.getItem("trip_data"));
const tripData = existingTripData ? existingTripData : JSON.parse(sessionStorage.getItem("trip_data"));

const existingTripID = localStorage.getItem("trip_id");
let tripID = existingTripID ? existingTripID : "";

export default function Trip() {
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [mapCenter, setMapCenter] = useState({ lat: -34.397, lng: 150.644 });
    const [days, setDays] = useState(
        existingTripData
            ? tripData.days.map((day) => {
                return { ...day.routeStops, placeResponses: [] };
            })
            : [{ placeResponses: [], markers: [], routePath: [], travelTimes: [], durations: {}, notes: {} }]
    );
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isAddDayDialogOpen, setIsAddDayDialogOpen] = useState(false);
    const [isNodeInfoDialogOpen, setIsNodeInfoDialogOpen] = useState(false);
    const [tripName, setTripName] = useState(tripData.name ? tripData.name : "Untitled Trip");

    const polylineRef = useRef(null);
    const mapRef = useRef(null);
    const placeService = useRef(null);

    const [hasEditPermission, setHasEditPermission] = useState(true);

    const fetchEditPermissions = useCallback(async () => {
	if (!tripID) {
            // Skip checking permissions if there's no trip_id yet
            setHasEditPermission(true);
            return;
	}
	const accessToken = await getAccessTokenSilently();
	try {
            const response = await axios.get(`${config.backend_endpoint}/api/private/get_can_edit?trip_id=${tripID}`, {
		headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
            });
            setHasEditPermission(response.data.can_edit);
	} catch (error) {
            console.log("Failed to determine if the user can edit the trip.", error);
            setHasEditPermission(false);
	}
    }, [getAccessTokenSilently]);

    // Whether user is the trip owner and should have a "share" button
    const [hasSharePermission, setHasSharePermission] = useState(false);
    // Whether sharing dialog is open
    const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);

    
    // viewers and editors for the trip sharing dialog
    const [viewers, setViewers] = useState('');
    const [editors, setEditors] = useState('');

    const fetchPermissions = useCallback(async (tripID) => {
	if (!tripID) {
            // Skip checking permissions if there's no trip_id yet
            setHasSharePermission(true);
            return;
	}
	
	const accessToken = await getAccessTokenSilently();
	try {
            const response = await axios.get(`${config.backend_endpoint}/api/private/get_is_trip_owner?trip_id=${tripID}`, {
		headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
            });

            if (response.data.is_owner) {
		setHasSharePermission(true);
		const viewersResponse = await axios.get(`${config.backend_endpoint}/api/private/get_trip_viewers?trip_id=${tripID}`, {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
		});
		const editorsResponse = await axios.get(`${config.backend_endpoint}/api/private/get_trip_editors?trip_id=${tripID}`, {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
		});

		const viewersArray = Array.isArray(viewersResponse.data.viewers) ? viewersResponse.data.viewers : [];
		const editorsArray = Array.isArray(editorsResponse.data.editors) ? editorsResponse.data.editors : [];
		setViewers(viewersArray.join(', '));
		setEditors(editorsArray.join(', '));
            } else {
		setHasSharePermission(false);
            }
	} catch (error) {
            console.log("Failed to determine if the user is the owner of the trip.", error);
            setHasSharePermission(false);
	}
}, [getAccessTokenSilently]);

    const fetchTripData = useCallback(async () => {
	try {
            const accessToken = await getAccessTokenSilently();
            if (tripID) {
		await getTrip(accessToken, tripID, (tripData) => {
                    sessionStorage.setItem("trip_data", JSON.stringify(tripData));
                    localStorage.setItem("trip_data", JSON.stringify(tripData));
                    fetchPermissions(tripID);
		});
		try {
                    const response = await axios.get(`${config.backend_endpoint}/api/private/get_trip_name?trip_id=${tripID}`, {
			headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                    });
                    if (response.data.trip_name) {
			setTripName(response.data.trip_name);
			sessionStorage.setItem("trip_name", response.data.trip_name);
                    }
		} catch (error) {
                    console.error("Failed to fetch trip name:", error);
		}
            }
	} catch (error) {
            console.error("Failed to fetch trip data:", error);
	}
    }, [getAccessTokenSilently, fetchPermissions]);


    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tripIDFromURL = params.get('id');

        if (tripIDFromURL) {
            tripID = tripIDFromURL;

            (async () => {
                try {
                    const accessToken = await getAccessTokenSilently();
                    await getTrip(accessToken, tripID, (tripData) => {
                        sessionStorage.setItem("trip_data", JSON.stringify(tripData));
                        localStorage.setItem("trip_data", JSON.stringify(tripData));
                        localStorage.setItem("trip_id", tripID);
			setTripName(tripData.name || "Untitled Trip");

                        // reset the URL
                        navigate('/trip', { replace: true });
                    });
                } catch (error) {
                    console.error("Failed to fetch trip data:", error);
                }
            })();
        }

        // Call the existing functions that load data and permissions
        fetchTripData();
        fetchEditPermissions();
    }, [getAccessTokenSilently, navigate, fetchEditPermissions, fetchTripData]);

    // attempt to enable sharing dialog
    useEffect(() => {
        fetchTripData();
	fetchEditPermissions();
    }, [getAccessTokenSilently, fetchPermissions, fetchTripData, fetchEditPermissions]);

    const handleOpenSharingDialog = async () => {
	if (tripID) {
            await fetchPermissions(); // refresh permissions before opening the dialog
            setIsSharingDialogOpen(true);	    
	}
    };

    const handleCloseSharingDialog = () => {
        setIsSharingDialogOpen(false);
    };

    useEffect(() => {
        if (tripData) {
            const newTripData = tripData;
            newTripData.days = days.map((day, index) => {
                // Removes placeResponses because it shows many deprecated errors that can't be removed/ignored.
                const { placeResponses, ...rest } = day;

                return { ...newTripData.days[index], routeStops: { ...rest } };
            });
            window.sessionStorage.setItem("trip_data", JSON.stringify(newTripData));
        }
    }, [days]);

    useEffect(() => {
        if (tripData) {
            const newTripData = tripData;
            newTripData.name = tripName;
            window.sessionStorage.setItem("trip_data", JSON.stringify(newTripData));
        }
    }, [tripName]);

    useEffect(() => {
        if (selectedNode && window.innerWidth <= 768) {
            setIsNodeInfoDialogOpen(true);
        }
    }, [selectedNode]);

    useEffect(() => {
        const handleResize = () => {
            // Your resize logic here
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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

            const newDays = days;
            newDays[0].markers = [
                {
                    position: location,
                    label: "1",
                    name: tripData.startingLocation.name,
                    info: tripData.startingLocation.address,
                    rating: tripData.startingLocation.rating || "N/A",
                    user_ratings_total: tripData.startingLocation.user_ratings_total || "N/A",
                    phone: tripData.startingLocation.international_phone_number || "",
                    website: tripData.startingLocation.website || ""
                }
            ];
            setDays(newDays);

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

        // Set service reference
        placeService.current = new window.google.maps.places.PlacesService(document.createElement("div"));

        const tags = tripData.days[dayIndex].dayTags;
        const responses = [];

        const transportMode = tripData.days[dayIndex].transportationMode;
        let radius;
        switch (transportMode) {
            case "DRIVING":
                radius = 5000;
                break;
            case "WALKING":
                radius = 1000;
                break;
            case "BICYCLING":
                radius = 2000;
                break;
            case "TRANSIT":
                radius = 3000;
                break;
            default:
                radius = 1500;
        }

        tags.forEach((tag) => {
            const request = {
                location,
                radius,
                type: tag,
                rankBy: window.google.maps.places.RankBy.PROMINENCE
            };

            placeService.current.nearbySearch(request, (results, status) => {
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

                if (requestLeft === 1) {
                    if (!usePrevStops) {
                        for (let i = 0; i < responses.length; i++) {
                            const usedPlaces = new Set(days.flatMap((day) => day.markers.map((marker) => marker.name)));
                            responses[i].results = responses[i].results.filter((place) => !usedPlaces.has(place.name));
                            responses[i].resultIndex = 0;
                        }
                    }

                    if (responses < MIN_DESTINATIONS_PER_DAY) {
                        console.error(
                            `Requires ${MIN_DESTINATIONS_PER_DAY} minimum, got ${responses.length}. These are the responses:`
                        );
                        console.log("Response:", responses);
                        return;
                    }

                    const newDestinations = [];
                    for (let i = 0; i < Math.min(MAX_DESTINATIONS_PER_DAY, Math.max(MIN_DESTINATIONS_PER_DAY, numTags)); i++) {
                        const responseIdx = i % responses.length;
                        newDestinations.push({
                            tag: responses[responseIdx].tag,
                            destination: responses[responseIdx].results[responses[responseIdx].resultIndex]
                        });
                        responses[responseIdx].resultIndex =
                            (responses[responseIdx].resultIndex + 1) % responses[responseIdx].results.length;
                    }

                    const fetchAllDetails = async () => {
                        try {
                            const detailedDestinations = await Promise.all(
                                newDestinations.map(async (place) => {
                                    const details = await fetchPlaceDetails(place.destination.place_id);
                                    return {
                                        ...place,
                                        details
                                    };
                                })
                            );

                            const newMarkers = detailedDestinations.map((place, index) => ({
                                position: {
                                    lat: place.details.geometry.location.lat(),
                                    lng: place.details.geometry.location.lng()
                                },
                                label: `${index + 2}`,
                                type: place.tag,
                                types: place.details.types,
                                name: place.details.name,
                                info: place.details.vicinity,
                                rating: place.details.rating,
                                user_ratings_total: place.details.user_ratings_total,
                                phone: place.details.international_phone_number,
                                website: place.details.website,
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
                            calculateRoute(location, newMarkers, dayIndex, transportMode);
                        } catch (error) {
                            console.error(`Error fetching place details: ${error.message}`);
                        }
                    };

                    fetchAllDetails();
                }
                requestLeft--;
            });
        });
    };

    /**
     * Gets the place details from the Google Places API.
     * @param {string} placeId Place ID
     * @returns {Promise<google.maps.places.PlaceResult>}
     */
    const fetchPlaceDetails = async (placeId) => {
        return new Promise((resolve, reject) => {
            placeService.current.getDetails({ placeId }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else {
                    reject(status);
                }
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
     * @param {string} transportMode Mode of transportation
     */
    const calculateRoute = (origin, places, dayIndex, transportMode) => {
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
            travelMode: window.google.maps.TravelMode[transportMode],
            optimizeWaypoints: true // Optimize the order of waypoints to form a circular route
        };

        directionsService
            .route(request, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    const route = result.routes[0].overview_path.map((point) => ({
                        lat: point.lat(),
                        lng: point.lng()
                    }));
                    const times = result.routes[0].legs.map((leg) => leg.duration.text);
                    const optimizedOrder = result.routes[0].waypoint_order;

                    // Reorder the markers based on the optimized order
                    const reorderedMarkers = optimizedOrder.map((index, i) => ({
                        ...places[index],
                        label: `${i + 2}` // Update the label to reflect the new order
                    }));
                    setDays((prevDays) => {
                        const updatedDays = [...prevDays];
                        updatedDays[dayIndex].markers = [updatedDays[dayIndex].markers[0], ...reorderedMarkers];
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
        setIsAddDayDialogOpen(true);
    };

    const getTransportIcon = (mode) => {
        const iconProps = { sx: { color: "#666666" } }; // Set the color here
        switch (mode) {
            case "DRIVING":
                return <DirectionsCarIcon {...iconProps} />;
            case "WALKING":
                return <DirectionsWalkIcon {...iconProps} />;
            case "BICYCLING":
                return <DirectionsBikeIcon {...iconProps} />;
            case "TRANSIT":
                return <DirectionsTransitIcon {...iconProps} />;
            default:
                return null;
        }
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
                    rating: tripData.startingLocation.rating || "N/A",
                    user_ratings_total: tripData.startingLocation.user_ratings_total || "N/A",
                    phone: tripData.startingLocation.international_phone_number || "",
                    website: tripData.startingLocation.website || ""
                }
            ],
            routePath: [],
            travelTimes: [],
            durations: {},
            notes: {},
            placeResponses: []
        };

        const newTripData = tripData;
        newTripData.days.push({
            index: newDayIndex,
            dayTags: newDay.tags,
            routeStops: [],
            usePreviousStops: newDay.usePrevStops,
            transportationMode: newDay.transportMode
        });
        window.sessionStorage.setItem("trip_data", JSON.stringify(newTripData));

        fetchNearbyPlaces(mapCenter, newDayIndex, newDay.usePrevStops);

        setDays((prevDays) => [...prevDays, newDayData]);
        setSelectedDayIndex(newDayIndex);
        setIsAddDayDialogOpen(false);
    };

    useEffect(() => {
        const selectedDayRoutePath = days[selectedDayIndex]?.routePath;

        // Function to render the polyline
        const renderPolyline = () => {
            // Remove the existing polylines from the map
            if (polylineRef.current) {
                polylineRef.current.forEach((polyline) => polyline.setMap(null));
                polylineRef.current = [];
            }

            // Add the polyline for the selected day
            if (selectedDayRoutePath && selectedDayRoutePath.length > 0 && mapRef.current) {
                const path = selectedDayRoutePath;
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
                polylineRef.current.forEach((polyline) => polyline.setMap(null));
                polylineRef.current = [];
            }
        };
    }, [selectedDayIndex, days, mapRef]);

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

    const handleRegenerateDay = async () => {
        const { markers, placeResponses } = days[selectedDayIndex];
        const [first, ...restMarkers] = markers;
        const newNodes = [];

        for (const marker of restMarkers) {
            const response = placeResponses.find((response) => response.tag === marker.type);

            const getNextPlace = (nodePlaceResponse) => {
                const result = nodePlaceResponse.results[nodePlaceResponse.resultIndex];
                nodePlaceResponse.resultIndex = (nodePlaceResponse.resultIndex + 1) % nodePlaceResponse.results.length;
                return result;
            };

            const nextPlace = getNextPlace(response);

            try {
                const nextPlaceDetails = await fetchPlaceDetails(nextPlace.place_id);

                const newNode = {
                    info: nextPlaceDetails.vicinity,
                    name: nextPlaceDetails.name,
                    phone: nextPlaceDetails.international_phone_number,
                    position: {
                        lat: nextPlaceDetails.geometry.location.lat(),
                        lng: nextPlaceDetails.geometry.location.lng()
                    },
                    rating: nextPlaceDetails.rating,
                    types: nextPlaceDetails.types,
                    user_ratings_total: nextPlaceDetails.user_ratings_total,
                    website: nextPlaceDetails.website
                };

                newNodes.push(newNode);
            } catch (error) {
                console.error(error);
            }
        }
        const newMarkers = newNodes.map((marker, index) => {
            return { ...markers[index + 1], ...marker };
        });

        setDays((prevState) => {
            const newDayData = [...prevState];
            newDayData[selectedDayIndex].markers = [first, ...newMarkers];
            newDayData[selectedDayIndex].durations = newMarkers.reduce((acc, marker) => {
                acc[marker.name] = { hours: 2, minutes: 0 };
                return acc;
            }, {});
            return newDayData;
        });

        const location = {
            lat: tripData.startingLocation.latitude || 0,
            lng: tripData.startingLocation.longitude || 0
        };
        calculateRoute(location, newMarkers, selectedDayIndex, tripData.days[selectedDayIndex].transportationMode);
    };

    const handleRegenerateNode = async () => {
        const nodePlaceResponse = days[selectedDayIndex].placeResponses.find((response) => response.tag === selectedNode.type);

        const getNextPlace = (nodePlaceResponse) => {
            const result = nodePlaceResponse.results[nodePlaceResponse.resultIndex];
            nodePlaceResponse.resultIndex = (nodePlaceResponse.resultIndex + 1) % nodePlaceResponse.results.length;
            return result;
        };
        const nextPlace = getNextPlace(nodePlaceResponse);

        try {
            const nextPlaceDetails = await fetchPlaceDetails(nextPlace.place_id);

            const newNode = {
                info: nextPlaceDetails.vicinity,
                name: nextPlaceDetails.name,
                phone: nextPlaceDetails.international_phone_number,
                position: {
                    lat: nextPlaceDetails.geometry.location.lat(),
                    lng: nextPlaceDetails.geometry.location.lng()
                },
                rating: nextPlaceDetails.rating,
                types: nextPlaceDetails.types,
                user_ratings_total: nextPlaceDetails.user_ratings_total,
                website: nextPlaceDetails.website
            };

            const newMarkers = days[selectedDayIndex].markers.map((marker, index) => {
                if (index === parseInt(selectedNode.label) - 1) {
                    return { ...marker, ...newNode };
                }
                return marker;
            });
            // Remove starting location from markers
            // eslint-disable-next-line no-unused-vars
            const [_, ...rest] = newMarkers;

            setDays((prevState) => {
                const newDayData = [...prevState];
                newDayData[selectedDayIndex].markers = newMarkers;
                delete newDayData[selectedDayIndex].durations[selectedNode.name]; // Remove the previous duration
                newDayData[selectedDayIndex].durations[newNode.name] = { hours: 2, minutes: 0 };
                return newDayData;
            });

            const location = {
                lat: tripData.startingLocation.latitude || 0,
                lng: tripData.startingLocation.longitude || 0
            };
            calculateRoute(location, rest, selectedDayIndex, tripData.days[selectedDayIndex].transportationMode);

            setSelectedNode(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries} onLoad={handleLoad}>
        {!hasEditPermission && (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Alert severity="warning">
                    You are in read-only mode and cannot edit this trip.
                </Alert>
            </Box>
        )}
            <Stack direction="column">
            <Stack direction="column" className="trip-container">
                <Stack
                    direction="row"
                    spacing={3}
                    sx={{ justifyContent: "space-between", alignItems: "center", mt: 3, height: 50 }}>
                    <Box display="flex" justifyContent="flex-start">
                        <TripTitle tripName={tripName} onTripNameChange={(newName) => setTripName(newName)} />
                    </Box>
                    <Box display="flex" justifyContent="flex-end">
		    {hasEditPermission && (<SaveTripButton tripName={tripName} fetchPermissions={fetchPermissions} />)}			
                    </Box>
                </Stack>
                <Box display="flex" alignItems="center" justifyContent="center" my={3}>
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
			    onClick={hasEditPermission ? handleAddDay : null}
			    sx={{
				width: 40,
				height: 40,
				borderRadius: "50%",
				backgroundColor: hasEditPermission ? "#777777" : "#cccccc",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "white",
				cursor: hasEditPermission ? "pointer" : "not-allowed"
			    }}>
			    +
			</Box>
                    </Box>
                </Box>
                <Stack direction={{ xs: "column", md: "row" }} className={`trip-content fade-in-fast`}>
                    <Box className="nodes-container" sx={{ mt: -8 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                            <Typography variant="h5" gutterBottom color="#686879">
                                {dayjs(tripData.startingDate).add(selectedDayIndex, "day").format("MMMM DD, YYYY")}
                            </Typography>
                            <Tooltip title="Regenerate Day" placement="right" arrow>
                                <IconButton onClick={handleRegenerateDay}>
                                    <ReplayIcon/>
                                </IconButton>
                            </Tooltip>
                        </Box>
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
                                        sx={{ cursor: "pointer" }}
                                        className="node">
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
                                            minWidth="265px"
                                            minHeight="65px"
                                            textAlign="center"
                                            boxShadow={3}>
                                            <Typography variant="h6">{marker.name}</Typography>
                                        </Box>
                                        {index < days[selectedDayIndex].markers.length - 1 && (
                                            <Box ml={3} display="flex" alignItems="center">
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
                                                <Box display="flex" alignItems="center" ml={2}>
                                                    {getTransportIcon(tripData.days[selectedDayIndex].transportationMode)}
                                                    <Typography
                                                        variant="body2"
                                                        ml={1}
                                                        color="#686879"
                                                        sx={{
                                                            width: "100px", // Set a fixed width
                                                            whiteSpace: "nowrap", // Prevent text from wrapping
                                                            overflow: "hidden", // Hide overflow text
                                                            textOverflow: "ellipsis" // Add ellipsis for overflow text
                                                        }}>
                                                        {days[selectedDayIndex].travelTimes[index]}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                )
                        )}
                        <Typography variant="body1" mt={2} align="center" color="#686879">
                            Total Time: {calculateTotalTripDuration()}
                        </Typography>
                    </Box>
                    <Box flex="1 1 auto" alignItems="center" className={`map-container ${selectedNode ? 'map-container-half' : ''}`}>
                        <GoogleMap
                            id="map"
                            onLoad={(map) => {
                                mapRef.current = map;
                            }}
                            mapContainerStyle={{ width: "100%", height: "100%" }} // Ensure the map container has explicit width and height
                            zoom={14}
                            center={mapCenter}
                            options={{ mapId: "651e26fab50abd83" }}>
                            {days[selectedDayIndex].markers.map(
                                (marker, index) =>
                                    marker && (
                                        <MarkerF
                                            key={index}
                                            position={marker.position}
                                            label={marker.label}
                                            onClick={() => setSelectedNode(selectedNode?.name === marker.name ? null : marker)}
                                        />
                                    )
                            )}
                        </GoogleMap>
                        {selectedNode && (
                            <Card mt={2} p={2} sx={{ minHeight: "400px", width: "100%", mt: 2 }} className="node-info-popup">
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" gutterBottom>
                                            {selectedNode.name}
                                        </Typography>{" "}
                                        <Box display="flex" gap={1.5}>
                                            {selectedNode.type && (
                                                <Paper variant="outlined" sx={{ borderColor: "rgba(25, 118, 210, 0.5)" }}>
                                                    <Tooltip
                                                        title="Regenerate Node"
                                                        placement="left"
                                                        arrow
                                                        sx={{ justifySelf: "start" }}>
                                                        <IconButton onClick={handleRegenerateNode} color="primary">
                                                            <SyncIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Paper>
                                            )}
                                            {selectedNode.website?.trim() && (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    href={selectedNode.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ textTransform: "none" }}
                                                    startIcon={<PublicIcon />}>
                                                    Website
                                                </Button>
                                            )}
                                            {selectedNode.phone?.trim() && (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    href={`tel:${selectedNode.phone}`}
                                                    sx={{ textTransform: "none" }}
                                                    startIcon={<CallIcon />}>
                                                    Call
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                    <Typography variant="body1" gutterBottom sx={{ mt: -0.75, mb: 2, color: "gray" }}>
                                        {selectedNode.info}
                                    </Typography>
                                    {!isNaN(parseFloat(selectedNode.rating)) && (
                                        <Box display="flex" alignItems="center" sx={{ mt: -0.75, mb: 2, color: "gray" }}>
                                            <Typography variant="body1" gutterBottom></Typography>
                                            <Rating value={selectedNode.rating} readOnly precision={0.5} />
                                        </Box>
                                    )}
                                    {selectedNode.types && (
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                                            <Typography variant="body1" sx={{ mt: 1 / 2 }}>
                                                Types:
                                            </Typography>
                                            {selectedNode.types.map((tag, index) => (
                                                <Chip
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
                                                        value={days[selectedDayIndex].durations[selectedNode.name]?.hours}
                                                        onChange={handleHoursChange}
                                                        style={{ marginRight: "10px" }}
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
                </Stack>
        </Stack>

	    {hasSharePermission && (
                <Tooltip title="Share Trip">
                    <IconButton
                        onClick={handleOpenSharingDialog}
                        sx={{
                            position: "fixed",
                            bottom: 16,
                            right: 16,
                            backgroundColor: "white",
                            boxShadow: 1 }}>
                        <ShareIcon />
                    </IconButton>
                </Tooltip>
            )}

            <SharingDialog
                open={isSharingDialogOpen}
                onClose={handleCloseSharingDialog}
                viewers={viewers}
                editors={editors}
		tripID={tripID}
                setViewers={setViewers}
                setEditors={setEditors}
            />
	
            <AddDayDialog
                open={isAddDayDialogOpen}
                onClose={() => setIsAddDayDialogOpen(false)}
                onSave={handleSaveDay}
                startingLocation={tripData.startingLocation.name}
                previousDayDate={dayjs().format("YYYY-MM-DD")}
            />
            <NodeInfoDialog
                open={isNodeInfoDialogOpen}
                onClose={() => {
                    setIsNodeInfoDialogOpen(false);
                    setSelectedNode(null); // Unselect the node
                }}
                selectedNode={selectedNode}
                days={days}
                selectedDayIndex={selectedDayIndex}
                handleHoursChange={handleHoursChange}
                handleMinutesChange={handleMinutesChange}
                handleNotesChange={handleNotesChange}
            />
        </Stack>
        </LoadScript>
    );
}

const TripTitle = ({ tripName, onTripNameChange }) => {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <>
            {isEditing ? (
                <TextField
                    variant="standard"
                    value={tripName}
                    onChange={(event) => onTripNameChange(event.target.value)}
                    onBlur={() => setIsEditing(false)}
                    slotProps={{ input: { style: { fontSize: "3em" }, disableUnderline: true } }}
                    fullWidth
                    autoFocus
                />
            ) : (
                <Typography variant="h3" className="trip-title" onClick={() => setIsEditing(true)} sx={{ "&:hover": { cursor: "pointer" } }}>
                    {tripName}
                </Typography>
            )}
        </>
    );
};

const SaveTripButton = ({ tripName, disabled, fetchPermissions }) => {
    const [icon, setIcon] = useState(<SaveIcon />);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        setIcon(<SaveIcon />);
    }, [tripName]);

    const handleSave = async () => {
	if (disabled) return;
        try {
            const tripData = JSON.parse(sessionStorage.getItem("trip_data"));
            const accessToken = await getAccessTokenSilently();

            const tripInfo = {
                data: tripData,
                id: tripID,
                name: tripName
            };

            await saveTrip(accessToken, tripInfo, (tripIDResponse) => {
                console.log(`Trip saved successfully! ID: ${tripIDResponse}`);
                tripID = tripIDResponse;
                setIcon(<CheckBoxOutlinedIcon color="success" />);
            });
            await getTrip(accessToken, tripID, (tripData) => {
                localStorage.setItem("trip_data", JSON.stringify(tripData));
                localStorage.setItem("trip_name", tripData.name);
		fetchPermissions();
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Tooltip title="Save Trip" placement="left" arrow>
            <IconButton variant="outlined" onClick={handleSave} disabled={disabled}>		
                {icon}
            </IconButton>
        </Tooltip>
    );
};

const SharingDialog = ({ open, onClose, viewers, editors, setViewers, setEditors, tripID }) => {
    const tripLink = `${config.frontend_endpoint}/trip?id=${tripID}`;
    const { getAccessTokenSilently } = useAuth0();

    const handleSave = async () => {
        const accessToken = await getAccessTokenSilently();
        try {
            await axios.post(
		// convert string of emails back into list for API
                `${config.backend_endpoint}/api/private/save_trip?trip_id=${tripID}&view=${viewers
                    .split(",")
                    .map((v) => v.trim())
                    .join(", ")}&edit=${editors
                    .split(",")
                    .map((e) => e.trim())
                    .join(", ")}`,
                null,		// Not modifying trip data
                {headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"}});
            onClose();
        } catch (error) {
            console.error("Failed to save editors or viewers:", error);
        }
    };

    const handleCopyLink = () => {
	navigator.clipboard.writeText(tripLink).then(() => {
            setCopied(true); 
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
	});
    };

// whether sharing link was copied
const [copied, setCopied] = useState(false);
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Share Trip</DialogTitle>
            <DialogContent>
                <TextField
                    label="Viewers"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    value={viewers}
                    onChange={(e) => setViewers(e.target.value)}
                />
                <TextField
                    label="Editors"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    value={editors}
                    onChange={(e) => setEditors(e.target.value)}
                />
                <Box display="flex" alignItems="center" mt={2}>
                    <TextField
                        label="Trip Link"
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        value={tripLink}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
		    <IconButton onClick={handleCopyLink} aria-label="copy trip link" color="primary">
			{copied ? <CheckBoxOutlinedIcon color="success" /> : <ContentCopyIcon />}
		    </IconButton>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
