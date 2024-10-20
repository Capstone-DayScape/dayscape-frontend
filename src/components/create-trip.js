import React from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { postPreferencesToAPI } from "../api";
import { useAuth0 } from "@auth0/auth0-react";

const libraries = ["places"];
const InfoMessageVariant = {
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
    ERROR: "error"
};

export default function CreateTrip() {
    // JSON structure to store data
    const tripData = {
        startingDate: "",
        startingLocation: {
            address: "",
            name: "",
            latitude: null,
            longitude: null
        },
        transportationMode: "",
        globalTags: [],
        days: [
            {
                index: 0,
                dayTags: [],
                routeStops: [],
                usePreviousStops: false
            }
        ]
    };
    const [dateObject, setDateObject] = React.useState(dayjs());
    const [startingAddress, setStartingAddress] = React.useState("");
    const [tagInput, setTagInput] = React.useState("");
    const [tags, setTags] = React.useState([]);
    const [transportMode, setTransportMode] = React.useState("");
    const [usePrevStops, setUsePrevStops] = React.useState(false);
    const [infoMessage, setInfoMessage] = React.useState({ message: "", variant: "" });

    const { getAccessTokenSilently } = useAuth0();

    const autocompleteRef = React.useRef(null);

    const saveData = async () => {
        setInfoMessage({ message: "Retrieving form data...", variant: InfoMessageVariant.INFO });
        try {
            const place = autocompleteRef.current.getPlace();

            if (place) {
                tripData.startingLocation.name = place.name;
                tripData.startingLocation.latitude = place.geometry.location.lat();
                tripData.startingLocation.longitude = place.geometry.location.lng();
            }

            tripData.startingLocation.address = startingAddress;
            tripData.startingDate = dateObject.hour(0).minute(0).second(0).millisecond(0).toISOString();
            tripData.days[0].usePreviousStops = usePrevStops;
            tripData.transportationMode = transportMode;

            setInfoMessage({ message: "Getting access token...", variant: InfoMessageVariant.INFO });
            const accessToken = await getAccessTokenSilently();
            setInfoMessage({ message: "Sending preferences to backend...", variant: InfoMessageVariant.INFO });
            await postPreferencesToAPI(accessToken, tags, (data) => {
                data.matched_list = data.matched_list || undefined;
                tripData.days[0].dayTags = data.matched_list;
            });

            // Stores data into session storage
            setInfoMessage({ message: "Saving to session...", variant: InfoMessageVariant.INFO });
            window.sessionStorage.setItem("data", JSON.stringify(tripData));
            setInfoMessage({ message: "Done.", variant: InfoMessageVariant.SUCCESS });

            // Go to trip page
            window.location.pathname = "/trip";
        } catch (error) {
            console.error(error);
            setInfoMessage({ message: error.message, variant: InfoMessageVariant.ERROR });
        }
    };

    const handleAddTag = () => {
        if (tagInput.length > 0 && !tags.includes(tagInput)) {
            setTags([...tags, tagInput]);
        }
        setTagInput(""); // Clears TextField input
    };

    return (
        <Box sx={{ width: 1 / 2, mx: "auto" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Typography variant="h2" sx={{ textAlign: "center" }} gutterBottom>
                    Create a new trip
                </Typography>
                <Stack direction="column" spacing={2}>
                    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
                        <Autocomplete
                            onLoad={(ref) => (autocompleteRef.current = ref)}
                            onPlaceChanged={() => {
                                setStartingAddress(autocompleteRef.current.getPlace().formatted_address);
                            }}>
                            <TextField
                                label="Starting Location"
                                name="startingLocation"
                                value={startingAddress}
                                onChange={(event) => setStartingAddress(event.target.value)}
                                fullWidth
                                required
                            />
                        </Autocomplete>
                    </LoadScript>
                    <DatePicker
                        minDate={dayjs()}
                        label="Starting Date"
                        name="startingDate"
                        value={dateObject}
                        onChange={(newDate) => setDateObject(newDate)}
                    />
                    <FormControl fullWidth>
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
                            name="tags"
                            value={tagInput}
                            onChange={(e) => {
                                setTagInput(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleAddTag();
                                }
                            }}
                            sx={{ width: 2 / 3 }}
                        />
                        <Button variant="outlined" onClick={handleAddTag} sx={{ width: 1 / 3 }}>
                            Add Tag
                        </Button>
                    </Stack>
                    {tags.length > 0 && (
                        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
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
                    {startingAddress ? (
                        <Button variant="contained" onClick={saveData}>
                            Create Trip
                        </Button>
                    ) : (
                        <Button variant="contained" disabled>
                            Create Trip
                        </Button>
                    )}
                </Stack>
            </LocalizationProvider>
        </Box>
    );
}
