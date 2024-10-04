import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Polyline, Autocomplete, InfoWindowF } from '@react-google-maps/api';
import { Box, TextField } from '@mui/material';

// Load the necessary libraries for Google Maps
const libraries = ['places', 'marker'];

const Trip = () => {
    const [mapCenter, setMapCenter] = useState({ lat: -34.397, lng: 150.644 });
    const [routePath, setRoutePath] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [AdvancedMarkerElement, setAdvancedMarkerElement] = useState(null);
    const [infoWindowPosition, setInfoWindowPosition] = useState(null);
    const [infoWindowContent, setInfoWindowContent] = useState('');
    const autocompleteRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    const handleLoad = () => {
        const loadGoogleMaps = async () => {
            if (window.google && window.google.maps) {
                const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
                setAdvancedMarkerElement(() => AdvancedMarkerElement);
                console.log("Google Maps JavaScript API loaded successfully.");
            } else {
                console.error("Google Maps JavaScript API is not loaded.");
            }
        };
        loadGoogleMaps();
    };

    useEffect(() => {
        if (AdvancedMarkerElement && mapRef.current) {
            // Clear existing markers
            markersRef.current.forEach(marker => marker.map = null);
            markersRef.current = [];

            // Add marker for selected location
            if (selectedLocation && selectedLocation.name) {
                const marker = new AdvancedMarkerElement({
                    map: mapRef.current,
                    position: selectedLocation,
                    title: selectedLocation.name,
                    content: createCustomMarker(selectedLocation.name),
                });
                marker.addListener('click', () => {
                    setInfoWindowPosition(selectedLocation);
                    setInfoWindowContent(selectedLocation.name);
                });
                markersRef.current.push(marker);
            }

            // Add markers for nearby places
            nearbyPlaces.forEach(place => {
                if (place.name) {
                    const marker = new AdvancedMarkerElement({
                        map: mapRef.current,
                        position: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
                        title: place.name,
                        content: createCustomMarker(place.name),
                    });
                    marker.addListener('click', () => {
                        setInfoWindowPosition({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                        setInfoWindowContent(place.name);
                    });
                    markersRef.current.push(marker);
                }
            });
        }
    }, [AdvancedMarkerElement, selectedLocation, nearbyPlaces]);

    // Function to create a custom marker element
    const createCustomMarker = (title) => {
        if (!title) return null; // Ensure title is defined
        const markerDiv = document.createElement('div');
        markerDiv.style.backgroundColor = '#4400DD'; // Blue color
        markerDiv.style.padding = '5px 10px'; // Add padding for better spacing
        markerDiv.style.borderRadius = '15%';
        markerDiv.style.display = 'flex';
        markerDiv.style.alignItems = 'center';
        markerDiv.style.justifyContent = 'center';
        markerDiv.style.color = '#FFFFFF';
        markerDiv.style.fontSize = '12px';
        markerDiv.style.fontWeight = 'bold';
        markerDiv.style.textAlign = 'center'; // Center text horizontally
        markerDiv.style.lineHeight = '1.2'; // Adjust line height for vertical alignment
        markerDiv.style.maxWidth = '150px'; // Set a maximum width for the bubble
        markerDiv.style.wordWrap = 'break-word'; // Allow text to wrap within the bubble
        markerDiv.innerText = title; // Display the full title
        return markerDiv;
    };

    // Handle the event when a place is selected from the Autocomplete
    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
            const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.name, // Set the actual name of the selected location
            };
            setSelectedLocation(location); // Set the selected location state
            setMapCenter(location); // Center the map on the selected location
            setInfoWindowPosition(location); // Set the info window position
            setInfoWindowContent(place.name); // Set the info window content to the actual name
            fetchNearbyPlaces(location); // Fetch nearby places based on the selected location
        }
    };

    // Fetch nearby places using the Google Places API
    const fetchNearbyPlaces = (location) => {
        const service = new window.google.maps.places.PlacesService(document.createElement('div')); // Create a new PlacesService instance
        const request = {
            location,
            radius: '5000', // Search within a 5000 meter radius
            type: ['restaurant'], // This is probably how we will filter out the places we want to visit by trip preferences
            rankBy: window.google.maps.places.RankBy.PROMINENCE, // Rank results by prominence
        };

        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                // Sort results by rating and take the top 3
                const sortedResults = results.sort((a, b) => b.rating - a.rating).slice(0, 3);
                setNearbyPlaces(sortedResults); // Update state with the top 3 places
                calculateRoute(location, sortedResults); // Calculate the route including these places
            }
        });
    };

    // Calculate the route between the selected location and the nearby places
    const calculateRoute = (origin, places) => {
        const directionsService = new window.google.maps.DirectionsService(); // Create a new DirectionsService instance
        const waypoints = places.map(place => ({
            location: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }, // Convert place geometry to lat/lng
            stopover: true, // Indicate that these are stopover points
        }));

        const request = {
            origin,
            destination: waypoints[waypoints.length - 1].location, // Set the last waypoint as the destination
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING, // Set the travel mode to driving
        };

        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                // Convert the route to an array of lat/lng points
                const route = result.routes[0].overview_path.map(point => ({
                    lat: point.lat(),
                    lng: point.lng(),
                }));
                setRoutePath(route); // Update state with the route path
            }
        });
    };

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries} onLoad={handleLoad}>
            <Box>
                <Box mb={2}>
                    <Autocomplete
                        onLoad={autocomplete => (autocompleteRef.current = autocomplete)} // Set the reference to the Autocomplete component
                        onPlaceChanged={handlePlaceChanged} // Handle the event when a place is selected
                    >
                        <TextField label="Select Location" variant="outlined" fullWidth />
                    </Autocomplete>
                </Box>
                <GoogleMap
                    id="map"
                    mapContainerStyle={{ height: '400px', width: '100%' }}
                    zoom={14}
                    center={mapCenter}
                    onLoad={map => {
                        mapRef.current = map;
                        map.setMapId('651e26fab50abd83');
                    }}
                >
                    {routePath.length > 0 && (
                        <>
                            <Polyline
                                path={routePath} // Set the path of the polyline
                                options={{
                                    strokeColor: '#DD0066', // Change to a nicer color
                                    strokeOpacity: 0.75,
                                    strokeWeight: 6,
                                }}
                            />
                        </>
                    )}
                    {infoWindowPosition && (
                        <InfoWindowF
                            position={infoWindowPosition}
                            onCloseClick={() => setInfoWindowPosition(null)}
                        >
                            <div>{infoWindowContent}</div>
                        </InfoWindowF>
                    )}
                </GoogleMap>
            </Box>
        </LoadScript>
    );
};

export default Trip;