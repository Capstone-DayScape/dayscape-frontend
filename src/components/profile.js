import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from "react";
import { getTestMessageFromAPI } from "../api.js";
import { Box, Button, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import TagInput from "./tag-input";

export default function Profile() {
    const { user, isLoading, getAccessTokenSilently } = useAuth0();

    const [data, setData] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [tags, setTags] = useState([]);
    const [isTagChanged, setIsTagChanged] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();
            await getTestMessageFromAPI(accessToken, (data) => setData(data));
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    const handleChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const handleTagChange = (newTags) => {
        setIsTagChanged(true);
        setTags(newTags);
    };

    return (
        <Box sx={{ width: 8 / 10, justifySelf: "center" }}>
            {isLoading ? (
                <Box>Loading...</Box>
            ) : (
                <Stack direction="row" spacing={5}>
                    <Paper sx={{ height: "fit-content" }}>
                        <Tabs value={tabIndex} onChange={handleChange} orientation="vertical" sx={{ my: 2 }}>
                            <Tab label="Profile" sx={{ px: 3 }} />
                            <Tab label="My Tags" sx={{ px: 3 }} />
                            <Tab label="My Trips" sx={{ px: 3 }} />
                        </Tabs>
                    </Paper>
                    <Paper sx={{ flexGrow: 1, height: 400 }} elevation={2}>
                        {/* Profile Tab */}
                        <CustomTabPanel value={tabIndex} index={0}>
                            <Stack direction="row" spacing={2}>
                                <img src={user.picture} alt={user.name} />
                                <Stack direction="column">
                                    <Typography variant="h5">{user.name}</Typography>
                                    <Typography variant="h6">{user.email}</Typography>
                                </Stack>
                            </Stack>
                            <Typography variant="p">{data?.message}</Typography>
                        </CustomTabPanel>
                        {/* My Tags Tab */}
                        <CustomTabPanel value={tabIndex} index={1}>
                            <Typography variant="h5">My Preferences</Typography>
                            <TagInput
                                onInfoMessage={(message) => console.log(message)}
                                tagsValue={tags}
                                onTagChange={handleTagChange}
                            />
                            <Button
                                disabled={!isTagChanged}
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    console.log("Save tags: ", tags);
                                    setIsTagChanged(false);
                                }}>
                                Save
                            </Button>
                        </CustomTabPanel>
                        {/* My Trips Tab */}
                        <CustomTabPanel value={tabIndex} index={2}>
                            <Typography variant="h5">My Trips</Typography>
                        </CustomTabPanel>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}

const CustomTabPanel = ({ children, value, index }) => {
    return (
        <Box>
            {value === index && (
                <Stack direction="column" spacing={3} sx={{ m: 4, flexGrow: 1 }}>
                    {children}
                </Stack>
            )}
        </Box>
    );
};
