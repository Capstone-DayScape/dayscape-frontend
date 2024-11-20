import AddIcon from "@mui/icons-material/Add";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import React, { useState } from "react";
import AddNodeDialog from "./add-node-dialog";

export default function MarkerList({ tripData, selectedNode, onSelectedNode, selectedDayIndex, days }) {
    const [isAddNodeDialogOpen, setAddNodeDialogOpen] = useState(false);

    /**
     * Returns the icon for the transportation mode.
     * @param {google.maps.TravelMode} mode Mode of transportation
     * @returns {React.ReactElement|null} Icon
     */
    const getTransportIcon = (mode) => {
        const iconProps = { sx: { color: "#666666" } }; // Set the color here
        switch (mode) {
            case "DRIVING":
                return <DirectionsCarIcon {...iconProps} />;
            case "WALKING":
                return <DirectionsWalkIcon {...iconProps} />;
            case "BICYCLING":
                return <DirectionsBikeIcon {...iconProps} />;
            case "TRANSIT":
                return <DirectionsTransitIcon {...iconProps} />;
            default:
                return null;
        }
    };

    const handleAddNode = (tag) => {
        console.log("Add new node!", tag);
    };

    return (
        <>
            {days[selectedDayIndex].markers.map(
                (marker, index) =>
                    marker && (
                        <Box
                            key={index}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            mb={2}
                            onClick={() => {
                                onSelectedNode(selectedNode?.name === marker.name ? null : marker);
                            }}
                            sx={{ cursor: "pointer" }}
                            className="node">
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                bgcolor={selectedNode?.name === marker.name ? "#4caf50" : "primary.main"}
                                color="white"
                                borderRadius="16px"
                                padding="10px"
                                width="100%"
                                minWidth="265px"
                                minHeight="65px"
                                textAlign="center"
                                boxShadow={3}>
                                <Typography variant="h6">{marker.name}</Typography>
                            </Box>
                            {index < days[selectedDayIndex].markers.length - 1 && (
                                <Box ml={3} display="flex" alignItems="center">
                                    <Box
                                        position="relative"
                                        width="2px"
                                        height="65px"
                                        bgcolor="#686879"
                                        mb={-2}
                                        sx={{
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                bottom: 0,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                borderLeft: "5px solid transparent",
                                                borderRight: "5px solid transparent",
                                                borderTop: "10px solid #686879"
                                            }
                                        }}
                                    />
                                    <Box display="flex" alignItems="center" ml={2}>
                                        {getTransportIcon(tripData.days[selectedDayIndex].transportationMode)}
                                        <Typography
                                            variant="body2"
                                            ml={1}
                                            color="#686879"
                                            sx={{
                                                width: "100px", // Set a fixed width
                                                whiteSpace: "nowrap", // Prevent text from wrapping
                                                overflow: "hidden", // Hide overflow text
                                                textOverflow: "ellipsis" // Add ellipsis for overflow text
                                            }}>
                                            {days[selectedDayIndex].travelTimes[index]}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )
            )}
            <Tooltip title="Add New Node" arrow placement="right">
                <IconButton
                    onClick={() => {
                        setAddNodeDialogOpen(true);
                    }}>
                    <AddIcon />
                </IconButton>
            </Tooltip>
            <AddNodeDialog
                open={isAddNodeDialogOpen}
                onClose={() => setAddNodeDialogOpen(false)}
                days={days}
                selectedDayIndex={selectedDayIndex}
                handleAddNode={handleAddNode}
            />
        </>
    );
}
