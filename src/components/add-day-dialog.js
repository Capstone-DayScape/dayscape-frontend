import { useAuth0 } from "@auth0/auth0-react";
import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getUserPreferences, translatePreferencesToTypes } from "../api";
import { INFO_MESSAGE_VARIANT } from "./constants";
import TagInput from "./tag-input";

const AddDayDialog = ({ open, onClose, onSave, startingLocation, previousDayDate }) => {
    const [dateObject, setDateObject] = useState(dayjs(previousDayDate).add(1, "day"));
    const [tags, setTags] = useState([]);
    const [transportMode, setTransportMode] = useState("DRIVING"); // Default to DRIVING
    const [usePrevStops, setUsePrevStops] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;
            const accessToken = await getAccessTokenSilently();

            await getUserPreferences(accessToken, (response) => {
                setTags(response.data);
            });
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently, isAuthenticated]);

    const handleSave = async () => {
        let accessToken;
        if (isAuthenticated) {
            accessToken = await getAccessTokenSilently();
        } else {
            accessToken = null;
        }

        try {
            setInfoMessage({ message: "Translating preferences to types...", variant: INFO_MESSAGE_VARIANT.INFO });
            await translatePreferencesToTypes(accessToken, tags, (data) => {
                const newDay = {
                    date: dateObject,
                    tags: data.matched_list,
                    transportMode,
                    usePrevStops
                };
                setInfoMessage({ message: "Preferences sent successfully.", variant: INFO_MESSAGE_VARIANT.SUCCESS });
                onSave(newDay); // Closes the dialog and saves the new day to the trip
            });
        } catch (error) {
            setInfoMessage({ message: "Error sending preferences to backend.", variant: INFO_MESSAGE_VARIANT.ERROR });
        }

        // Resetting after saving
        setTags([]);
        setTransportMode("DRIVING");
        setUsePrevStops(false);
        setInfoMessage({ message: "", variant: "" });
        setDateObject((prev) => prev.add(1, "day"));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Day</DialogTitle>
            <DialogContent sx={{ pb: 0 }}>
                <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label="Starting Date" value={dateObject} disabled />
                    </LocalizationProvider>
                    <TextField label="Starting Location" value={startingLocation} disabled />
                    <FormControl>
                        <InputLabel id="transportLabel">Mode of Transportation</InputLabel>
                        <Select
                            labelId="transportLabel"
                            label="Mode of Transportation"
                            variant="outlined"
                            value={transportMode}
                            onChange={(event) => setTransportMode(event.target.value)}>
                            <MenuItem value="DRIVING">Driving</MenuItem>
                            {/* <MenuItem value="TRANSIT">Transit</MenuItem> */}
                            <MenuItem value="BICYCLING">Bicycling</MenuItem>
                            <MenuItem value="WALKING">Walking</MenuItem>
                        </Select>
                    </FormControl>
                    <TagInput
                        onInfoMessage={(message) => setInfoMessage(message)}
                        tagsValue={tags}
                        onTagChange={(newTags) => setTags(newTags)}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox checked={usePrevStops} onChange={(e) => setUsePrevStops(e.target.checked)} />
                        }
                        label="Use Previous Stops"
                    />
                    {infoMessage.message && (
                        <Alert
                            severity={infoMessage.variant}
                            onClose={() => setInfoMessage({ variant: "", message: "" })}>
                            {infoMessage.message}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {tags.length > 0 ? <Button onClick={handleSave}>Add Day</Button> : <Button disabled>Add Day</Button>}
            </DialogActions>
        </Dialog>
    );
};

export default AddDayDialog;
