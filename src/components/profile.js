import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { getTestMessage, getTrip, getUserPreferences, saveUserPreferences, translatePreferencesToTypes } from "../api.js";
import TagInput from "../components/tag-input";
import { INFO_MESSAGE_VARIANT } from "./constants";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import config from "../config";
import axios from "axios";

export default function Profile() {
    const { isLoading } = useAuth0();

    const [tabIndex, setTabIndex] = useState(0);

    const handleChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    return (
        <Box sx={{ width: 8 / 10, justifySelf: "center" }}>
            {isLoading ? (
                <Box>Loading...</Box>
            ) : (
                <Stack direction="row" spacing={5}>
                    <Paper sx={{ height: "fit-content" }}>
                        <Tabs value={tabIndex} onChange={handleChange} orientation="vertical" sx={{ my: 2 }}>
                            <Tab label="Profile" sx={{ px: 3 }} />
                            <Tab label="My Tags" sx={{ px: 3 }} />
                            <Tab label="My Trips" sx={{ px: 3 }} />
                        </Tabs>
                    </Paper>
                    <Paper sx={{ flexGrow: 1, minHeight: 500 }} elevation={2}>
                        <ProfileTab value={tabIndex} index={0} />
                        <MyTagsTab value={tabIndex} index={1} />
                        <MyTripsTab value={tabIndex} index={2} />
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}

const CustomTabPanel = ({ children, value, index }) => {
    return (
        <Box>
            {value === index && (
                <Stack direction="column" spacing={3} sx={{ m: 4, flexGrow: 1 }}>
                    {children}
                </Stack>
            )}
        </Box>
    );
};

const ProfileTab = ({ value, index }) => {
    const [data, setData] = useState(null);

    const { user, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();
            await getTestMessage(accessToken, (data) => setData(data));
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    return (
        <CustomTabPanel value={value} index={index}>
            <Stack direction="row" spacing={2}>
                <img src={user.picture} alt="User Profile" />
                <Stack direction="column">
                    <Typography variant="h5">{user.name}</Typography>
                    <Typography variant="h6">{user.email}</Typography>
                </Stack>
            </Stack>
            <Typography variant="p">{data?.message}</Typography>
        </CustomTabPanel>
    );
};

const MyTagsTab = ({ value, index }) => {
    const [tags, setTags] = useState([]);
    const [isTagChanged, setIsTagChanged] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    const { getAccessTokenSilently } = useAuth0();

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
        <CustomTabPanel value={value} index={index}>
            <Typography variant="h5">My Preferences</Typography>
            <TagInput onInfoMessage={(message) => setInfoMessage(message)} tagsValue={tags} onTagChange={handleTagChange} />
            {infoMessage.message && (
                <Alert severity={infoMessage.variant} onClose={() => setInfoMessage({ variant: "", message: "" })}>
                    {infoMessage.message}
                </Alert>
            )}
            <Button disabled={!isTagChanged} variant="contained" color="primary" onClick={handleSave}>
                Save
            </Button>
        </CustomTabPanel>
    );
};

const MyTripsTab = ({ value, index }) => {
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
                    setSharedTrips(sharedResponse.data);
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
        <CustomTabPanel value={value} index={index}>
            <Typography variant="h5">My Trips</Typography>
            <Box>
                <Typography variant="h6">Owned by me</Typography>
                {ownedTrips.length > 0 ? (
                    <ul>
                        {ownedTrips.map((trip) => (
                            <li key={trip.uuid}>
                                {trip.name}
                                <Button onClick={() => handleEditTrip(trip.uuid, trip.name)} startIcon={<EditIcon />}>
                                    Edit
                                </Button>
                                <Button onClick={() => handleOpenDeleteDialog(trip)} color="error">
                                    Delete
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Typography>No owned trips available.</Typography>
                )}
            </Box>
            <Box>
                <Typography variant="h6">Shared with me</Typography>
                {sharedTrips.length > 0 ? (
                    <ul>
                        {sharedTrips.map((trip) => (
                            <li key={trip.uuid}>
                                {trip.name}
                                <Button onClick={() => handleEditTrip(trip.uuid, trip.name)} startIcon={<EditIcon />}>
                                    Edit
                                </Button>
                                <Button onClick={() => handleOpenDeleteDialog(trip)} color="error">
                                    Delete
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Typography>No shared trips available.</Typography>
                )}
            </Box>

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
        </CustomTabPanel>
    );
};
