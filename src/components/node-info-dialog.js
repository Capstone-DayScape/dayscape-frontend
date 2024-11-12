import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Chip, Stack, FormControl, Rating, IconButton } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import PublicIcon from '@mui/icons-material/Public';
import SyncIcon from '@mui/icons-material/Sync';

const NodeInfoDialog = ({ open, onClose, selectedNode, days, selectedDayIndex, handleHoursChange, handleMinutesChange, handleNotesChange, handleRegenerateNode }) => {
    const handleRegenerateAndClose = () => {
        handleRegenerateNode();
        onClose();
    };
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {selectedNode?.name}
                    </Typography>
                    <Box display="flex" gap={3}>
                        {selectedNode?.type && (
                            <IconButton
                                color="primary"
                                onClick={handleRegenerateAndClose}
                                sx={{
                                    border: '1px solid',
                                    borderRadius: '50%',
                                    padding: '8px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <SyncIcon />
                            </IconButton>
                        )}
                        {selectedNode?.phone?.trim() && (
                            <IconButton
                                color="primary"
                                href={`tel:${selectedNode.phone}`}
                                sx={{
                                    border: '1px solid',
                                    borderRadius: '50%',
                                    padding: '8px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
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
                                    border: '1px solid',
                                    borderRadius: '50%',
                                    padding: '8px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <PublicIcon />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    {selectedNode?.info}
                </Typography>
                {!isNaN(parseFloat(selectedNode?.rating)) && (
                    <Box display="flex" alignItems="center" sx={{ mt: -0.75, mb: 2, color: "gray" }}>
                        <Typography variant="body1" gutterBottom></Typography>
                        <Rating value={selectedNode?.rating} readOnly precision={0.5} />
                    </Box>
                )}
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NodeInfoDialog;