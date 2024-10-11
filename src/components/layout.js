import React from "react";
import { AppBar, Toolbar, Typography, Container, Box, Button, Link } from "@mui/material";
import { Helmet } from "react-helmet";
import { useAuth0 } from "@auth0/auth0-react";

const Layout = ({ children }) => {
    const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh"
            }}>
            <Helmet>
                <title>DayScape</title>
            </Helmet>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        <Link href="/" color="white" underline="none">
                            DayScape
                        </Link>
                    </Typography>
                    {!isAuthenticated && (
                        <Button
                            color="inherit"
                            onClick={() => {
                                loginWithRedirect().catch(() => console.error("Unable to redirect to login!"));
                            }}>
                            Log in
                        </Button>
                    )}
                    {isAuthenticated && (
                        <>
                            <Button
                                color="inherit"
                                onClick={() => {
                                    logout({ logoutParams: { returnTo: window.location.origin } }).catch(() => {
                                        console.error("Unable to logout!");
                                    });
                                }}>
                                Log Out
                            </Button>
                            <Button color="inherit" href="/profile">
                                Profile
                            </Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Container sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Box mt={2}>{children}</Box>
            </Container>
            <footer>
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        p: 2,
                        textAlign: "center"
                    }}>
                    <Typography variant="body1">2024 DayScape</Typography>
                </Box>
            </footer>
        </Box>
    );
};

export default Layout;
