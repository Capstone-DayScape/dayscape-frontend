// src/components/Home.js
import React from 'react';
import { Typography, Box, Button } from '@mui/material';

const Home = () => {
    return (
        <Box>
            <Typography variant="h2" gutterBottom>
                Welcome to DayScape!
            </Typography>
            <Typography variant="h5" gutterBottom>
                Your go-to app for planning day trips.
            </Typography>
            <Button variant="contained" color="primary" href="/about">
                Learn More
            </Button>
        </Box>
    );
};

export default Home;
