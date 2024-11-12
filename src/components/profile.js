import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Box, Button, Paper, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import React, { useState, useEffect } from "react";
import { getTestMessage, getTrip, getUserPreferences, saveUserPreferences, translatePreferencesToTypes } from "../api.js";
import TagInput from "../components/tag-input";
import { INFO_MESSAGE_VARIANT } from "./constants";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import './styles/styles.css'; 

import config from "../config";
import axios from "axios";

export default function Profile() {
    const { isLoading } = useAuth0();

    return (
        <Box sx={{ width: 8 / 10, justifySelf: "center" }}>
            {isLoading ? (
                <Box>Loading...</Box>
            ) : (
                <Stack direction="column" spacing={5}>
                    <Paper sx={{ height: "fit-content", p: 3 }}>
                        <ProfileTab />
                    </Paper>
                    <Paper sx={{ height: "fit-content", p: 3 }}>
                        <MyTripsTab />
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}

const ProfileTab = () => {
    const [data, setData] = useState(null);

    const { user, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();
            await getTestMessage(accessToken, (data) => setData(data));
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    const [tags, setTags] = useState([]);
    const [isTagChanged, setIsTagChanged] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();

            await getUserPreferences(accessToken, (response) => {
                setTags(response.data);
            });
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    const handleTagChange = (newTags) => {
        setIsTagChanged(true);
        setTags(newTags);
    };

    const handleSave = async () => {
        const accessToken = await getAccessTokenSilently();
        let typesList = [];

        try {
            setInfoMessage({ message: "Translating preferences to types...", variant: INFO_MESSAGE_VARIANT.INFO });
            await translatePreferencesToTypes(accessToken, tags, (response) => {
                typesList = response.matched_list;
                setTags(response.matched_list);
            });
            setInfoMessage({ message: "Saving preferences...", variant: INFO_MESSAGE_VARIANT.INFO });
            await saveUserPreferences(accessToken, typesList, (response) => {
                setInfoMessage({ message: response, variant: INFO_MESSAGE_VARIANT.SUCCESS });
            });
        } catch (error) {
            console.error(error);
            setInfoMessage({ message: "Error saving preferences.", variant: INFO_MESSAGE_VARIANT.ERROR });
        }
        setIsTagChanged(false);
    };

    return (
        <Stack direction="column" spacing={3}>
            <Stack direction="row" spacing={2}>
                <img src={user.picture} alt="User Profile" />
                <Stack direction="column">
                    <Typography variant="h5">{user.name}</Typography>
                    <Typography variant="h6">{user.email}</Typography>
                </Stack>
            </Stack>
            <Typography variant="body1">{data?.message}</Typography>
            <Typography variant="h5">My Preferences</Typography>
            <TagInput onInfoMessage={(message) => setInfoMessage(message)} tagsValue={tags} onTagChange={handleTagChange} />
            {infoMessage.message && (
                <Alert severity={infoMessage.variant} onClose={() => setInfoMessage({ variant: "", message: "" })}>
                    {infoMessage.message}
                </Alert>
            )}
            <Button disabled={!isTagChanged} variant="contained" color="primary" onClick={handleSave} sx={{ alignSelf: 'flex-end', minHeight: '50px', minWidth: '115px' }}>
                Save
            </Button>
        </Stack>
    );
};

const MyTripsTab = () => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentTripToDelete, setCurrentTripToDelete] = useState(null);

    const handleOpenDeleteDialog = (trip) => {
        setCurrentTripToDelete(trip);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setCurrentTripToDelete(null);
    };

    const handleDeleteTrip = async () => {
        const accessToken = await getAccessTokenSilently();
        try {
            const response = await axios.get(
                `${config.backend_endpoint}/api/private/delete_trip?trip_id=` + currentTripToDelete.uuid,
                {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                }
            );
            if (response.status === 200) {
                // Remove the deleted trip from the list
                setOwnedTrips((trips) => trips.filter((trip) => trip.uuid !== currentTripToDelete.uuid));
                setSharedTrips((trips) => trips.filter((trip) => trip.uuid !== currentTripToDelete.uuid));
            }
        } catch (error) {
            console.error("Error deleting trip: ", error);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const [ownedTrips, setOwnedTrips] = useState([]);
    const [sharedTrips, setSharedTrips] = useState([]);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchTrips = async () => {
            const accessToken = await getAccessTokenSilently();

            try {
                const ownedResponse = await axios.get(config.backend_endpoint + "/api/private/get_owned_trips_list", {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                });
                if (ownedResponse.status === 200) {
                    setOwnedTrips(ownedResponse.data);
                }
            } catch (error) {
                console.error("Error fetching owned trips:", error);
            }

            try {
                const sharedResponse = await axios.get(config.backend_endpoint + "/api/private/get_shared_trips_list", {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                });
                if (sharedResponse.status === 200) {
                const trips = sharedResponse.data;
                const sharedTripsWithPermissions = await Promise.all(trips.map(async (trip) => {
                    const response = await axios.get(`${config.backend_endpoint}/api/private/get_can_edit?trip_id=${trip.uuid}`, {
                        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                    });
                    return { ...trip, canEdit: response.data.can_edit };
                }));
                setSharedTrips(sharedTripsWithPermissions);
                }
            } catch (error) {
                console.error("Error fetching shared trips:", error);
            }
        };

        fetchTrips().catch((err) => console.error("Error in fetching trips:", err));
    }, [getAccessTokenSilently]);

    const handleEditTrip = async (tripId, tripName) => {
        const accessToken = await getAccessTokenSilently();

        await getTrip(accessToken, tripId, (tripData) => {
            localStorage.setItem("trip_id", tripId);
            localStorage.setItem("trip_name", tripName);
            localStorage.setItem("trip_data", JSON.stringify(tripData));

            window.location.href = "/trip"; // Redirect to the trip page
        });
    };

    return (
        <Stack direction="column" spacing={3}>
            <Typography variant="h5">My Trips</Typography>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Owned by me</Typography>
                {ownedTrips.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableBody>
                                {ownedTrips.map((trip) => (
                                    <TableRow key={trip.uuid}>
                                        <TableCell>
                                            <Link 
                                                to={`/trip/edit/${trip.uuid}`} 
                                                className={"trip-link"}
                                                style={{ color: "#0288d1", display: 'flex', alignItems: 'center' }}
                                                onClick={() => handleEditTrip(trip.uuid, trip.name)}
                                            >
                                                {trip.name}
                                                <EditLocationAltIcon sx={{ ml: 1 }} />
                                            </Link>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button onClick={() => handleOpenDeleteDialog(trip)} color="error">
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell>
                                        <Link to="/create-trip" className={"trip-link"} style={{ color: "#388e3c", display: 'flex', alignItems: 'center' }}>
                                            <AddIcon sx={{ mr: 1, ml: -0.5 }} />
                                            Add a new trip
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography>No owned trips available.</Typography>
                )}
            </Paper>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Shared with me</Typography>
                {sharedTrips.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableBody>
                                {sharedTrips.map((trip) => (
                                    <TableRow key={trip.uuid}>
                                        <TableCell>
                                            <Link 
                                                to={`/trip/edit/${trip.uuid}`} 
                                                className={"trip-link"}
                                                style={{ color: trip.canEdit ? "#0288d1" : "#f57c00", display: 'flex', alignItems: 'center' }}
                                                onClick={() => handleEditTrip(trip.uuid, trip.name)}
                                            >
                                                {trip.name}
                                                {trip.canEdit ? (
                                                    <EditLocationAltIcon sx={{ ml: 1 }} />
                                                ) : (
                                                    <FmdGoodIcon sx={{ ml: 1 }} />
                                                )}
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography>No shared trips available.</Typography>
                )}
            </Paper>
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the trip "{currentTripToDelete?.name}? This is final and cannot be
                        reversed!"
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteTrip} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};