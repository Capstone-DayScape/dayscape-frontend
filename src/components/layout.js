import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Container, Box, Button, Link, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Helmet } from "react-helmet";
import { useAuth0 } from "@auth0/auth0-react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import EventIcon from "@mui/icons-material/Event";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";

const Layout = ({ children }) => {
    const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    const drawerList = (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                <ListItem button component="a" href="/">
                    <ListItemIcon><LightModeIcon /></ListItemIcon>
                    <ListItemText primary="Home" disableTypography sx={{ color: '#616161' }} />
                </ListItem>
                <ListItem button component="a" href="/create-trip">
                    <ListItemIcon><EventIcon /></ListItemIcon>
                    <ListItemText primary="Create Trip" disableTypography sx={{ color: '#616161' }} />
                </ListItem>
                {!isAuthenticated ? (
                    <ListItem button onClick={() => loginWithRedirect().catch(() => console.error("Unable to redirect to login!"))}>
                        <ListItemIcon><LoginIcon /></ListItemIcon>
                        <ListItemText primary="Log in" disableTypography sx={{ color: '#616161' }} />
                    </ListItem>
                ) : (
                    <>
                        <ListItem button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } }).catch(() => console.error("Unable to logout!"))} sx={{ color: 'inherit' }}>
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Log Out" disableTypography sx={{ color: '#616161' }} />
                        </ListItem>
                        <ListItem button component="a" href="/profile">
                            <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                            <ListItemText primary="Account" disableTypography sx={{ color: '#616161' }} />
                        </ListItem>
                    </>
                )}
            </List>
        </Box>
    );

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
            <AppBar position="sticky">
                <Toolbar>
                    <Typography variant="h6" sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Link href="/" color="white" underline="none">
                            DayScape
                            <LightModeIcon sx={{ ml: 1 }} />
                        </Link>
                    </Typography>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
                        <Button color="inherit" href="/create-trip" startIcon={<EventIcon />}>
                            Create Trip
                        </Button>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                        {!isAuthenticated && (
                            <Button
                                color="inherit"
                                startIcon={<LoginIcon />}
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
                                    startIcon={<LogoutIcon />}
                                    onClick={() => {
                                        logout({ logoutParams: { returnTo: window.location.origin } }).catch(() => {
                                            console.error("Unable to logout!");
                                        });
                                    }}>
                                    Log Out
                                </Button>
                                <Button color="inherit" href="/profile" startIcon={<AccountCircleIcon />}>
                                    Account
                                </Button>
                            </>
                        )}
                    </Box>
                    <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        sx={{ display: { xs: 'block', md: 'none' } }}
                        onClick={toggleDrawer(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
            >
                {drawerList}
            </Drawer>
            <Container sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Box my={2}>{children}</Box>
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