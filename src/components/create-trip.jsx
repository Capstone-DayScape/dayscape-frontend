import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function CreateTrip() {
    // JSON to store data
    const data = {
        startingDate: "",
        startingLocation: {
            address: ""
        }
    };
    const [dateObject, setDateObject] = React.useState(dayjs());
    const [startingAddress, setStartingAddress] = React.useState("");

    const printToLog = () => {
        data.startingLocation.address = startingAddress;
        data.startingDate = dateObject.toJSON();
        console.log(data);
    };
    return (
        <Box sx={{ width: 1 / 2, mx: "auto" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Typography variant="h2" sx={{ textAlign: "center" }} gutterBottom>
                    Create a new trip
                </Typography>
                <Stack direction="column" spacing={2}>
                    <TextField
                        label="Starting Location"
                        name="startingLocation"
                        value={startingAddress}
                        onChange={(event) => setStartingAddress(event.target.value)}
                        required
                    />
                    <DatePicker
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
                    <Button variant="contained" onClick={printToLog}>
                        Create Trip
                    </Button>
                </Stack>
            </LocalizationProvider>
        </Box>
    );
}
