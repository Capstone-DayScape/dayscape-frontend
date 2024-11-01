import { useAuth0 } from "@auth0/auth0-react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
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
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { getUserPreferences, translatePreferencesToTypes } from "../api";
import { INFO_MESSAGE_VARIANT } from "./constants";
import TagInput from "./tag-input"; // Determines the maximum number of destinations and tags per day

const libraries = ["places"];

// JSON structure to store data
const tripData = {
    startingDate: "",
    startingLocation: {
        address: "",
        name: "",
        latitude: null,
        longitude: null
    },
    globalTags: [],
    days: [
        {
            index: 0,
            dayTags: [],
            routeStops: [],
            usePreviousStops: false,
            transportationMode: ""
        }
    ]
};

export default function CreateTrip() {
    const [dateObject, setDateObject] = React.useState(dayjs());
    const [startingAddress, setStartingAddress] = React.useState("");
    const [tags, setTags] = React.useState([]);
    const [transportMode, setTransportMode] = React.useState("DRIVING");
    const [usePrevStops, setUsePrevStops] = React.useState(false);
    const [infoMessage, setInfoMessage] = React.useState({ message: "", variant: "" });

    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    const autocompleteRef = React.useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();

            await getUserPreferences(accessToken, (response) => {
                setTags(response.data);
            });
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    const saveData = async () => {
        setInfoMessage({ message: "Retrieving from data...", variant: INFO_MESSAGE_VARIANT.INFO });
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
            tripData.days[0].transportationMode = transportMode;

            let accessToken;
            if (isAuthenticated) {
                setInfoMessage({ message: "Getting access token...", variant: INFO_MESSAGE_VARIANT.INFO });
                accessToken = await getAccessTokenSilently();
            } else {
                accessToken = null;
            }
            setInfoMessage({ message: "Translating preferences to types...", variant: INFO_MESSAGE_VARIANT.INFO });
            await translatePreferencesToTypes(accessToken, tags, (data) => {
                data.matched_list = data.matched_list || undefined;
                tripData.days[0].dayTags = data.matched_list;
            });

            // Stores data into session storage
            setInfoMessage({ message: "Saving to session...", variant: INFO_MESSAGE_VARIANT.INFO });
            window.sessionStorage.setItem("data", JSON.stringify(tripData));
            setInfoMessage({ message: "Done.", variant: INFO_MESSAGE_VARIANT.SUCCESS });

            // Go to trip page
            window.location.pathname = "/trip";
        } catch (error) {
            setInfoMessage({ message: error.message, variant: INFO_MESSAGE_VARIANT.ERROR });
        }
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
                            onClose={() => setInfoMessage({ message: "", variant: "" })}>
                            {infoMessage.message}
                        </Alert>
                    )}
                    {startingAddress && tags.length > 0 ? (
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
