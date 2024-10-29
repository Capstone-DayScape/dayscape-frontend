import React, { useState } from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Checkbox,
    FormControlLabel,
    Stack,
    Chip,
    Alert
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { MAX_DESTINATIONS_PER_DAY } from "./trip";
import { INFO_MESSAGE_VARIANT } from "./create-trip";
import { postPreferencesToAPI } from "../api";
import { useAuth0 } from "@auth0/auth0-react";

const AddDayDialog = ({ open, onClose, onSave, startingLocation, previousDayDate }) => {
    const [dateObject, setDateObject] = useState(dayjs(previousDayDate).add(1, "day"));
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState([]);
    const [transportMode, setTransportMode] = useState("DRIVING");
    const [usePrevStops, setUsePrevStops] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    const handleSave = async () => {
        let accessToken;
        if (isAuthenticated) {
            accessToken = await getAccessTokenSilently();
        } else {
            accessToken = null;
        }

        try {
            setInfoMessage({ message: "Sending preferences to backend...", variant: INFO_MESSAGE_VARIANT.INFO });
            await postPreferencesToAPI(accessToken, tags, (data) => {
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

    const handleAddTag = () => {
        if (
            (tagInput.length > 0 || tagInput.length < 40) &&
            !tags.includes(tagInput.trim()) &&
            tagInput.trim().length > 0
        ) {
            if (tags.length < MAX_DESTINATIONS_PER_DAY) {
                setTags([...tags, tagInput.trim()]);
            } else {
                setInfoMessage({ message: "Maximum number of tags reached.", variant: INFO_MESSAGE_VARIANT.WARNING });
            }
        }
        setTagInput(""); // Clears TextField input
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
                            <MenuItem value="TRANSIT">Transit</MenuItem>
                            <MenuItem value="BICYCLING">Bicycling</MenuItem>
                            <MenuItem value="WALKING">Walking</MenuItem>
                        </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && tagInput.length > 0) {
                                    handleAddTag();
                                }
                            }}
                            sx={{ flex: 1 }} // Set the width to take up available space
                        />
                        <Button variant="outlined" onClick={handleAddTag}>
                            Add Tag
                        </Button>
                    </Stack>
                    {tags.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                            {tags.map((tag, index) => (
                                <Chip
                                    label={tag}
                                    key={index}
                                    onDelete={() => setTags(tags.filter((tagStr) => tagStr !== tag))}
                                />
                            ))}
                        </Stack>
                    )}
                    <FormControlLabel
                        control={
                            <Checkbox checked={usePrevStops} onChange={(e) => setUsePrevStops(e.target.checked)} />
                        }
                        label="Use Previous Stops"
                    />
                    {infoMessage.message && <Alert severity={infoMessage.variant}>{infoMessage.message}</Alert>}
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
