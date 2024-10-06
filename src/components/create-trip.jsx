import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function CreateTrip() {
    const printToLog = () => {
        console.log("Hello World");
    };
    return (
        <Box sx={{ width: 1 / 2, mx: "auto" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Typography variant="h2" sx={{ textAlign: "center" }} gutterBottom>
                    Create a new trip
                </Typography>
                <form id="createTripForm">
                    <Stack direction="column" spacing={2}>
                        <TextField label="Starting Location" name="startingLocation" required />
                        <DatePicker label="Starting Date" name="startingDate" />
                        {/*<Stack direction="row" spacing={2}>*/}
                        {/*    <TextField label="Tags" name="tags" />*/}
                        {/*    <Button variant="outlined">Add</Button>*/}
                        {/*</Stack>*/}
                        {/*<FormControlLabel control={<Checkbox />} label="Use Previous Stops" />*/}
                        <Button variant="contained" onClick={printToLog}>
                            Create Trip
                        </Button>
                    </Stack>
                </form>
            </LocalizationProvider>
        </Box>
    );
}
