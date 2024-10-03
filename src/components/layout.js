import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Helmet } from 'react-helmet';

const Layout = ({ children }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <Helmet>
                <title>DayScape</title>
            </Helmet>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        DayScape
                    </Typography>
                    <Button color="inherit" href="/login">Login</Button>
                    <Button color="inherit" href="/signup">Sign Up</Button>
                </Toolbar>
            </AppBar>
            <Container sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box mt={2}>{children}</Box>
            </Container>
            <footer>
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        p: 2,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body1">2024 DayScape</Typography>
                </Box>
            </footer>
        </Box>
    );
};

export default Layout;