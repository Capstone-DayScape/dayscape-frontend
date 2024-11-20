import CallIcon from "@mui/icons-material/Call";
import PublicIcon from "@mui/icons-material/Public";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SyncIcon from "@mui/icons-material/Sync";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    Rating,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import React from "react";

const NodeInfoDialog = ({
    open,
    onClose,
    selectedNode,
    days,
    selectedDayIndex,
    handleHoursChange,
    handleMinutesChange,
    handleNotesChange,
    handleRegenerateNode,
    handleDeleteNode
}) => {
    const handleRegenerateAndClose = () => {
        handleRegenerateNode();
        onClose();
    };
    const handleDeleteAndClose = () => {
        handleDeleteNode();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6">{selectedNode?.name}</Typography>
                <Typography variant="body1" gutterBottom>
                    {selectedNode?.info}
                </Typography>
                {!isNaN(parseFloat(selectedNode?.rating)) && (
                    <Box display="flex" alignItems="center" sx={{ mt: -0.75, color: "gray" }}>
                        <Typography variant="body1" gutterBottom></Typography>
                        <Rating value={selectedNode?.rating} readOnly precision={0.5} />
                    </Box>
                )}
            </DialogTitle>
            <Stack direction="row" justifyContent="space-evenly" sx={{ my: 1 }}>
                {selectedNode?.type && (
                    <>
                        <IconButton
                            color="error"
                            onClick={handleDeleteAndClose}
                            sx={{ border: "1px solid", borderRadius: "50%" }}>
                            <RemoveCircleIcon />
                        </IconButton>
                        <IconButton
                            color="warning"
                            onClick={handleRegenerateAndClose}
                            sx={{
                                border: "1px solid",
                                borderRadius: "50%",
                                padding: "8px",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)"
                                }
                            }}>
                            <SyncIcon />
                        </IconButton>
                    </>
                )}
                {selectedNode?.phone?.trim() && (
                    <IconButton
                        color="primary"
                        href={`tel:${selectedNode.phone}`}
                        sx={{
                            border: "1px solid",
                            borderRadius: "50%",
                            padding: "8px",
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)"
                            }
                        }}>
                        <CallIcon />
                    </IconButton>
                )}
                {selectedNode?.website?.trim() && (
                    <IconButton
                        color="primary"
                        href={selectedNode.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            border: "1px solid",
                            borderRadius: "50%",
                            padding: "8px",
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)"
                            }
                        }}>
                        <PublicIcon />
                    </IconButton>
                )}
            </Stack>
            <DialogContent>
                <Stack direction="column" spacing={2}>
                    {selectedNode?.types && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                            <Typography variant="body1" sx={{ mt: 1 / 2 }}>
                                Types:
                            </Typography>
                            {selectedNode.types.map((tag, index) => (
                                <Chip
                                    variant="outlined"
                                    color={selectedNode.type === tag ? "primary" : "default"}
                                    label={tag}
                                    key={index}
                                />
                            ))}
                        </Stack>
                    )}
                    {selectedNode?.label !== "1" && (
                        <>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <Typography variant="body1">Duration:</Typography>
                                <Box display="flex">
                                    <TextField
                                        label="Hours"
                                        type="number"
                                        variant="outlined"
                                        margin="normal"
                                        value={days[selectedDayIndex].durations[selectedNode?.name]?.hours}
                                        onChange={handleHoursChange}
                                        style={{ marginRight: "10px" }}
                                        slotProps={{ htmlInput: { min: 0 } }}
                                    />
                                    <TextField
                                        label="Minutes"
                                        type="number"
                                        variant="outlined"
                                        margin="normal"
                                        value={days[selectedDayIndex].durations[selectedNode?.name]?.minutes}
                                        onChange={handleMinutesChange}
                                        slotProps={{ htmlInput: { min: 0 } }}
                                    />
                                </Box>
                            </FormControl>
                        </>
                    )}
                    <TextField
                        label="Enter Notes"
                        multiline
                        rows={4}
                        variant="outlined"
                        fullWidth
                        value={days[selectedDayIndex].notes[selectedNode?.name] || ""}
                        onChange={handleNotesChange}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NodeInfoDialog;
