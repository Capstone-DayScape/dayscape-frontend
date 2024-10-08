import React from "react";
import { Typography, Box, Button, Stack } from "@mui/material";

const Home = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{ marginTop: "-100px" }}>
            <Typography variant="h2" gutterBottom>
                Welcome to DayScape!
            </Typography>
            <Typography variant="h5" gutterBottom>
                Your go-to site for planning day trips.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    href="/create-trip"
                    sx={{ marginTop: 5, padding: "12px 24px", fontSize: "1rem" }}>
                    Create Trip
                </Button>
            </Stack>
        </Box>
    );
};

export default Home;
