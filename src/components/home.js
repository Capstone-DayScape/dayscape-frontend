import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{ marginTop: '-100px' }}
        >
            <Typography variant="h2" gutterBottom>
                Welcome to DayScape!
            </Typography>
            <Typography variant="h5" gutterBottom>
                Your go-to site for planning day trips.
            </Typography>
            <Button variant="contained" color="primary" component={Link} to="/trip" sx={{ marginTop: 5, padding: '12px 24px', fontSize: '1rem' }}>
                New Trip
            </Button>
        </Box>
    );
};

export default Home;