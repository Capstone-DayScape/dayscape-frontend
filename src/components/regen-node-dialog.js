import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export const RegenNodeDialog = ({ open, onClose, onAccept, tag }) => {
    return (
        <Dialog open={open}>
            <DialogTitle>Do you want to regenerate this node?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    This will replace the current node with another destination.
                </DialogContentText>
                <DialogContentText>
                    Current tag: <em>{tag}</em>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onAccept}>Yes</Button>
            </DialogActions>
        </Dialog>
    );
};
