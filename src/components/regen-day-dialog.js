import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export const RegenDayDialog = ({ open, onClose, onAccept }) => {
    return (
        <Dialog open={open}>
            <DialogTitle>Do you want to regenerate this day?</DialogTitle>
            <DialogContent>
                <DialogContentText>This will replace all node for this day with new ones.</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onAccept}>Yes</Button>
            </DialogActions>
        </Dialog>
    );
};
