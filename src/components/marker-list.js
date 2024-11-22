import AddIcon from "@mui/icons-material/Add";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import React, { useState } from "react";
import AddNodeDialog from "./add-node-dialog";
import { getRadiusFromTransportationMode } from "./constants";

/**
 * MarkerList component for displaying markers as nodes.
 * @param {{days:Object[], name:string, startingDate:string, startingLocation:Object}} tripData Object from (local/session) storage.
 * @param {Object} selectedNode Currently selected node
 * @param {function} onSelectedNode Callback to change selected node
 * @param {number} selectedDayIndex Index of the currently selected day
 * @param {Object[]} days Array of days
 * @param {function} setDays Callback to update days
 * @param {React.MutableRefObject} placeServiceRef Reference to the Google Places API service
 * @param {function} calculateRoute Callback to calculate route
 * @returns {React.ReactElement} Element to display
 * @constructor
 */
export default function MarkerList({
    tripData,
    selectedNode,
    onSelectedNode,
    selectedDayIndex,
    days,
    setDays,
    placeServiceRef,
    calculateRoute
}) {
    const [isAddNodeDialogOpen, setAddNodeDialogOpen] = useState(false);

    /**
     * Returns the icon for the transportation mode.
     * @param {google.maps.TravelMode} mode Mode of transportation
     * @returns {React.ReactElement|null} Icon
     */
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

    const handleAddNode = async (tag) => {
        // Checks if the tag already exists in the current day's placeResponses
        /** @type {{results:google.maps.places.PlaceResult[], resultIndex:number, tag:string}} */
        const existingPlaceResponse = days[selectedDayIndex].placeResponses.find((response) => response.tag === tag);

        /**
         * Gets the next place result.
         * @param {{results:google.maps.places.PlaceResult[], resultIndex:number, tag:string}} placeResponse Place response object
         * @returns {google.maps.places.PlaceResult}
         */
        const getNextDestination = (placeResponse) => {
            const result = placeResponse.results[placeResponse.resultIndex];
            placeResponse.resultIndex = (placeResponse.resultIndex + 1) % placeResponse.results.length;
            return result;
        };

        // Adds it to the placeResponses if it doesn't exist
        if (!existingPlaceResponse) {
            /** @type {google.maps.places.PlacesService} */
            const placeService = placeServiceRef.current;
            const transportMode = tripData.days[selectedDayIndex].transportationMode;
            const radius = getRadiusFromTransportationMode(transportMode);
            const request = {
                location: { lat: tripData.startingLocation.latitude || 0, lng: tripData.startingLocation.longitude || 0 },
                radius,
                type: tag,
                rankBy: window.google.maps.places.RankBy.PROMINENCE
            };
            placeService.nearbySearch(request, async (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    setDays((prev) => {
                        const updatedDays = [...prev];
                        updatedDays[selectedDayIndex].placeResponses = [
                            ...updatedDays[selectedDayIndex].placeResponses,
                            { tag, results, resultIndex: 0 }
                        ];
                        return updatedDays;
                    });
                }
                const placeResponse = days[selectedDayIndex].placeResponses.find((response) => response.tag === tag);

                const nextDestination = getNextDestination(placeResponse);
                const nextDestinationDetails = await fetchPlaceDetails(nextDestination.place_id);

                const newNode = {
                    info: nextDestinationDetails.vicinity,
                    name: nextDestinationDetails.name,
                    phone: nextDestinationDetails.international_phone_number,
                    position: {
                        lat: nextDestinationDetails.geometry.location.lat(),
                        lng: nextDestinationDetails.geometry.location.lng()
                    },
                    rating: nextDestinationDetails.rating,
                    types: nextDestinationDetails.types,
                    user_ratings_total: nextDestinationDetails.user_ratings_total,
                    website: nextDestinationDetails.website,
                    label: `${days[selectedDayIndex].markers.length}`,
                    type: tag,
                    duration: { hours: 2, minutes: 0 }
                };

                const updatedMarkers = [...days[selectedDayIndex].markers, newNode];
                // eslint-disable-next-line no-unused-vars
                const [_, ...rest] = updatedMarkers;

                setDays((prev) => {
                    const updatedDays = [...prev];
                    updatedDays[selectedDayIndex].markers = updatedMarkers;
                    updatedDays[selectedDayIndex].durations = {
                        ...prev[selectedDayIndex].durations,
                        [newNode.name]: { hours: 2, minutes: 0 }
                    };
                    return updatedDays;
                });

                const location = {
                    lat: tripData.startingLocation.latitude,
                    lng: tripData.startingLocation.longitude
                };

                calculateRoute(location, rest, selectedDayIndex, transportMode);
                onSelectedNode(null);
            });
            return;
        }
        // Continues if the tag already exists in the current day's placeResponses
        const nextDestination = getNextDestination(existingPlaceResponse);
        const nextDestinationDetails = await fetchPlaceDetails(nextDestination.place_id);

        const newNode = {
            info: nextDestinationDetails.vicinity,
            name: nextDestinationDetails.name,
            phone: nextDestinationDetails.international_phone_number,
            position: {
                lat: nextDestinationDetails.geometry.location.lat(),
                lng: nextDestinationDetails.geometry.location.lng()
            },
            rating: nextDestinationDetails.rating,
            types: nextDestinationDetails.types,
            user_ratings_total: nextDestinationDetails.user_ratings_total,
            website: nextDestinationDetails.website,
            label: `${days[selectedDayIndex].markers.length}`,
            type: tag,
            duration: { hours: 2, minutes: 0 }
        };

        const updatedMarkers = [...days[selectedDayIndex].markers, newNode];
        // eslint-disable-next-line no-unused-vars
        const [_, ...rest] = updatedMarkers;

        setDays((prev) => {
            const updatedDays = [...prev];
            updatedDays[selectedDayIndex].markers = updatedMarkers;
            updatedDays[selectedDayIndex].durations = {
                ...prev[selectedDayIndex].durations,
                [newNode.name]: { hours: 2, minutes: 0 }
            };
            return updatedDays;
        });

        const location = {
            lat: tripData.startingLocation.latitude,
            lng: tripData.startingLocation.longitude
        };

        calculateRoute(location, rest, selectedDayIndex, tripData.days[selectedDayIndex].transportationMode);
        onSelectedNode(null);
    };

    /**
     * Gets the place details for the given placeId from the Google Places API.
     * @param {string} placeId
     * @returns {Promise<google.maps.places.PlaceResult>} Place details
     */
    const fetchPlaceDetails = async (placeId) => {
        return new Promise((resolve, reject) => {
            const placeService = placeServiceRef.current;

            placeService.getDetails({ placeId }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else {
                    reject(status);
                }
            });
        });
    };

    return (
        <>
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
                                onSelectedNode(selectedNode?.name === marker.name ? null : marker);
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
                                <Typography variant="h6" sx={{ userSelect: "none" }}>
                                    {marker.name}
                                </Typography>
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
                                                textOverflow: "ellipsis", // Add ellipsis for overflow text
                                                userSelect: "none"
                                            }}>
                                            {days[selectedDayIndex].travelTimes[index]}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )
            )}
            <Tooltip title="Add New Node" arrow placement="right">
                <IconButton
                    onClick={() => {
                        setAddNodeDialogOpen(true);
                    }}>
                    <AddIcon />
                </IconButton>
            </Tooltip>
            <AddNodeDialog
                open={isAddNodeDialogOpen}
                onClose={() => setAddNodeDialogOpen(false)}
                days={days}
                selectedDayIndex={selectedDayIndex}
                handleAddNode={handleAddNode}
            />
        </>
    );
}
