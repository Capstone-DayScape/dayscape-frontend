import { useAuth0 } from "@auth0/auth0-react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Radio,
    Select,
    Stack,
    TextField
} from "@mui/material";
import { useState } from "react";
import { translatePreferencesToTypes } from "../api";
import { INFO_MESSAGE_VARIANT } from "./constants";

export default function AddNodeDialog({ open, onClose, handleAddNode, days, selectedDayIndex }) {
    const [selectedTag, setSelectedTag] = useState("");
    const [typedTag, setTypedTag] = useState("");
    const [optionChecked, setOptionChecked] = useState("select");
    const [infoMessage, setInfoMessage] = useState({ message: "", variant: "" });

    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    const handleAddNodeAndClose = async () => {
        switch (optionChecked) {
            case "select":
                handleAddNode(selectedTag);
                break;
            case "text":
                setInfoMessage({ message: "Getting access token...", variant: INFO_MESSAGE_VARIANT.INFO });
                const accessToken = isAuthenticated ? await getAccessTokenSilently() : null;
                setInfoMessage({ message: "Translating preferences to types...", variant: INFO_MESSAGE_VARIANT.INFO });
                await translatePreferencesToTypes(accessToken, [typedTag], (response) => {
                    handleAddNode(response.matched_list[0]);
                    setInfoMessage({
                        message: `Translated to: ${response.matched_list[0]}. Done`,
                        variant: INFO_MESSAGE_VARIANT.SUCCESS
                    });
                });
                break;
            default:
                console.error("Invalid option selected");
        }
        setSelectedTag("");
        setOptionChecked("select");
        setTypedTag("");
        setInfoMessage({ message: "", variant: "" });
        onClose();
    };

    const handleOptionChange = (event) => {
        setOptionChecked(event.target.value);
    };

    const handleClose = () => {
        onClose();
        setSelectedTag(null);
        setOptionChecked("select");
        setTypedTag("");
        setInfoMessage({ message: "", variant: "" });
    };

    const handleDisabledAddNodeButton = () => {
        const selectedTagChosen = optionChecked === "select";
        const typedTagChosen = optionChecked === "text";
        const valid = (selectedTagChosen && selectedTag) || (typedTagChosen && typedTag);
        return !valid;
    };

    return (
        <Dialog open={open}>
            <DialogTitle>Adding New Node</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    This will add a new destination to the current day route with the following tag
                </DialogContentText>
                <Stack direction="column" spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Radio
                            checked={optionChecked === "select"}
                            value="select"
                            onChange={handleOptionChange}
                            sx={{ height: 1 / 2 }}></Radio>
                        <FormControl fullWidth>
                            <InputLabel id="selectTagLabel">Select Existing Tag</InputLabel>
                            <Select
                                variant="outlined"
                                value={selectedTag}
                                labelId="selectTagLabel"
                                label="Select Existing Tag"
                                onChange={(event) => setSelectedTag(event.target.value)}>
                                {days[selectedDayIndex].placeResponses.map((placeResponse, index) => {
                                    return (
                                        <MenuItem key={index} value={placeResponse.tag}>
                                            {placeResponse.tag}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Radio
                            checked={optionChecked === "text"}
                            value="text"
                            onChange={handleOptionChange}
                            sx={{ height: 1 / 2 }}></Radio>
                        <TextField
                            fullWidth
                            value={typedTag}
                            onChange={(event) => setTypedTag(event.target.value)}
                            label="Type New Tag"></TextField>
                    </Stack>
                    {infoMessage.message && (
                        <Alert
                            severity={infoMessage.variant}
                            onClose={() => {
                                setInfoMessage({ message: "", variant: "" });
                            }}>
                            {infoMessage.message}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleAddNodeAndClose} disabled={handleDisabledAddNodeButton()}>
                    Add Node
                </Button>
            </DialogActions>
        </Dialog>
    );
}
