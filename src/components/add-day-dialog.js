import React, { useState, useEffect } from "react";
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
    Chip
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const AddDayDialog = ({ open, onClose, onSave, startingLocation, previousDayDate }) => {
    const [dateObject, setDateObject] = useState(dayjs(previousDayDate).add(1, 'day'));
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState([]);
    const [transportMode, setTransportMode] = useState("");
    const [usePrevStops, setUsePrevStops] = useState(false);

    useEffect(() => {
        setDateObject(dayjs(previousDayDate).add(1, 'day'));
    }, [previousDayDate]);

    const handleSave = () => {
        const newDay = {
            date: dateObject,
            tags,
            transportMode,
            usePrevStops
        };
        console.log("usePrevStops in AddDayDialog:", usePrevStops); // Debugging line
        onSave(newDay);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Day</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Starting Date"
                        value={dateObject}
                        onChange={(newDate) => setDateObject(newDate)}
                        disabled
                        fullWidth
                    />
                </LocalizationProvider>
                <TextField
                    label="Starting Location"
                    value={startingLocation}
                    fullWidth
                    disabled
                    margin="normal"
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel id="transportLabel">Mode of Transportation</InputLabel>
                    <Select
                        labelId="transportLabel"
                        label="Mode of Transportation"
                        value={transportMode}
                        onChange={(event) => setTransportMode(event.target.value)}>
                        <MenuItem value="DRIVING">Driving</MenuItem>
                        <MenuItem value="TRANSIT">Transit</MenuItem>
                        <MenuItem value="BICYCLING">Bicycling</MenuItem>
                        <MenuItem value="WALKING">Walking</MenuItem>
                    </Select>
                </FormControl>
                <Stack direction="row" spacing={2} alignItems="center" margin="normal">
                    <TextField
                        label="Tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        sx={{ flex: 1 }} // Set the width to take up available space
                    />
                    <Button
                        variant="outlined"
                        onClick={() => {
                            if (tagInput.length > 0 && !tags.includes(tagInput)) {
                                setTags([...tags, tagInput]);
                                setTagInput(''); // Clear the input after adding the tag
                            }
                        }}
                        sx={{ height: '56px', flexShrink: 0 }}>
                        Add Tag
                    </Button>
                </Stack>
                {tags.length > 0 && (
                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap margin="normal">
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
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Add Day</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDayDialog;