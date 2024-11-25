import { Box, Button, Stack, Typography } from "@mui/material";
import "./styles/styles.css";

const Home = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{ marginTop: "-100px" }}>
            <Typography variant="h2" gutterBottom className="fade-in" style={{ animationDelay: "0s" }}>
                Welcome to DayScape!
            </Typography>
            <Typography variant="h5" gutterBottom className="fade-in" style={{ animationDelay: "0.5s" }}>
                Your go-to site for planning day trips.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    href="/create-trip"
                    sx={{ marginTop: 5, padding: "12px 24px", fontSize: "1rem" }}
                    className="fade-in"
                    style={{ animationDelay: "0.75s" }}>
                    Create Trip
                </Button>
            </Stack>
        </Box>
    );
};

export default Home;
