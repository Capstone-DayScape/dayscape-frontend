import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

const Layout = ({ children }) => {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6">DayScape</Typography>
                </Toolbar>
            </AppBar>
            <Container>
                <Box mt={2}>{children}</Box>
            </Container>
            <footer>
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        p: 2,
                        marginTop: 'auto',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body1">© 2024 DayScape</Typography>
                </Box>
            </footer>
        </>
    );
};

export default Layout;
