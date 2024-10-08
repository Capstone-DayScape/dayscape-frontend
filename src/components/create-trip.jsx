import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

export default function CreateTrip() {
    // JSON to store data
    const data = {
        startingDate: "",
        startingLocation: {
            address: "",
            name: "",
            latitude: null,
            longitude: null
        }
    };
    const [dateObject, setDateObject] = React.useState(dayjs());
    const [startingAddress, setStartingAddress] = React.useState("");
    const autocompleteRef = React.useRef(null);

    const printToLog = () => {
        const place = autocompleteRef.current.getPlace();

        data.startingLocation.address = startingAddress;
        data.startingDate = dateObject.hour(0).minute(0).second(0).millisecond(0).toISOString();

        if (place) {
            data.startingLocation.name = place.name;
            data.startingLocation.latitude = place.geometry.location.lat();
            data.startingLocation.longitude = place.geometry.location.lng();
        }

        // Stores data into session storage
        window.sessionStorage.setItem("data", JSON.stringify(data));
    };

    return (
        <Box sx={{ width: 1 / 2, mx: "auto" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Typography variant="h2" sx={{ textAlign: "center" }} gutterBottom>
                    Create a new trip
                </Typography>
                <Stack direction="column" spacing={2}>
                    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
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
                    {/*<Stack direction="row" spacing={2}>*/}
                    {/*    <TextField label="Tags" name="tags" />*/}
                    {/*    <Button variant="outlined">Add</Button>*/}
                    {/*</Stack>*/}
                    {/*<FormControlLabel control={<Checkbox />} label="Use Previous Stops" />*/}
                    <Button variant="contained" onClick={printToLog} href="/trip">
                        Create Trip
                    </Button>
                </Stack>
            </LocalizationProvider>
        </Box>
    );
}
