import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { getTestMessage, getUserPreferences, saveUserPreferences, translatePreferencesToTypes } from "../api.js";
import TagInput from "../components/tag-input";
import { INFO_MESSAGE_VARIANT } from "./constants";

export default function Profile() {
    const { isLoading } = useAuth0();

    const [tabIndex, setTabIndex] = useState(0);

    const handleChange = (event, newValue) => {
        setTabIndex(newValue);
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
                    <Paper sx={{ flexGrow: 1, height: 500 }} elevation={2}>
                        <ProfileTab value={tabIndex} index={0} />
                        <MyTagsTab value={tabIndex} index={1} />
                        <MyTripsTab value={tabIndex} index={2} />
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

const ProfileTab = ({ value, index }) => {
    const [data, setData] = useState(null);

    const { user, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();
            await getTestMessage(accessToken, (data) => setData(data));
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    return (
        <CustomTabPanel value={value} index={index}>
            <Stack direction="row" spacing={2}>
                <img src={user.picture} alt="User Profile" />
                <Stack direction="column">
                    <Typography variant="h5">{user.name}</Typography>
                    <Typography variant="h6">{user.email}</Typography>
                </Stack>
            </Stack>
            <Typography variant="p">{data?.message}</Typography>
        </CustomTabPanel>
    );
};

const MyTagsTab = ({ value, index }) => {
    const [tags, setTags] = useState([]);
    const [isTagChanged, setIsTagChanged] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();

            await getUserPreferences(accessToken, (response) => {
                setTags(response.data);
            });
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    const handleTagChange = (newTags) => {
        setIsTagChanged(true);
        setTags(newTags);
    };

    const handleSave = async () => {
        const accessToken = await getAccessTokenSilently();
        let typesList = [];

        try {
            await translatePreferencesToTypes(accessToken, tags, (response) => {
                typesList = response.matched_list;
                setTags(response.matched_list);
            });
            await saveUserPreferences(accessToken, typesList, (response) => {
                console.log(response);
            });
            await getUserPreferences(accessToken, (response) => {
                console.log(response);
            });
            setInfoMessage({ message: "Preferences saved successfully.", variant: INFO_MESSAGE_VARIANT.SUCCESS });
        } catch (error) {
            console.error(error);
            setInfoMessage({ message: "Error saving preferences.", variant: INFO_MESSAGE_VARIANT.ERROR });
        }
        setIsTagChanged(false);
    };

    return (
        <CustomTabPanel value={value} index={index}>
            <Typography variant="h5">My Preferences</Typography>
            <TagInput
                onInfoMessage={(message) => setInfoMessage(message)}
                tagsValue={tags}
                onTagChange={handleTagChange}
            />
            {infoMessage.message && (
                <Alert severity={infoMessage.variant} onClose={() => setInfoMessage({ variant: "", message: "" })}>
                    {infoMessage.message}
                </Alert>
            )}
            <Button disabled={!isTagChanged} variant="contained" color="primary" onClick={handleSave}>
                Save
            </Button>
        </CustomTabPanel>
    );
};

const MyTripsTab = ({ value, index }) => {
    return (
        <CustomTabPanel value={value} index={index}>
            <Typography variant="h5">My Trips</Typography>
        </CustomTabPanel>
    );
};
