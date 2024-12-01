import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export const RemoveNodeDialog = ({ open, onClose, onAccept }) => {
    return (
        <Dialog open={open}>
            <DialogTitle>Do you want to remove this node?</DialogTitle>
            <DialogContent>
                <DialogContentText>This will remove the current node.</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onAccept}>Yes</Button>
            </DialogActions>
        </Dialog>
    );
};
