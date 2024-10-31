import { Button, Chip, Stack, TextField } from "@mui/material";
import React from "react";
import { MAX_DESTINATIONS_PER_DAY, INFO_MESSAGE_VARIANT } from "./constants";

/**
 * Creates an input for tags and displays them underneath as chips.
 * @param {function} onInfoMessage Called when an _info message_ is returned
 * @param {string[]} tagsValue The current `tags` value
 * @param {function} onTagChange Called when `tags` changes
 * @returns {ReactElement} Element displayed
 * @constructor
 */
export default function TagInput({ onInfoMessage, tagsValue, onTagChange }) {
    const [tagInput, setTagInput] = React.useState("");

    const handleAddTag = () => {
        if (
            (tagInput.length > 0 || tagInput.length < 40) &&
            !tagsValue.includes(tagInput.trim()) &&
            tagInput.trim().length > 0
        ) {
            if (tagsValue.length < MAX_DESTINATIONS_PER_DAY) {
                onTagChange([...tagsValue, tagInput.trim()]);
            } else {
                onInfoMessage({ message: "Maximum number of tags reached.", variant: INFO_MESSAGE_VARIANT.WARNING });
            }
        }
        setTagInput(""); // Clears TextField input
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && tagInput.length > 0) {
            handleAddTag();
        }
    };

    return (
        <>
            <Stack direction="row" spacing={2}>
                <TextField
                    label="Tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{ flex: 1 }} // Set the width to take up available space
                />
                <Button variant="outlined" onClick={handleAddTag} sx={{ px: 3 }}>
                    Add Tag
                </Button>
            </Stack>
            {tagsValue.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                    {tagsValue.map((tag, index) => (
                        <Chip
                            label={tag}
                            key={index}
                            onDelete={() => onTagChange(tagsValue.filter((tagStr) => tagStr !== tag))}
                        />
                    ))}
                </Stack>
            )}
        </>
    );
}
