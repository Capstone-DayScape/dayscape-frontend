import React, { useState } from 'react';
import { Box, TextField } from '@mui/material';
import { LoadScript, GoogleMap, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const Trip = () => {
    const [autocomplete, setAutocomplete] = useState(null);
    const [map, setMap] = useState(null);
    const [place, setPlace] = useState(null);

    const handlePlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            console.log('Place:', place);
            setPlace(place);
            if (place.geometry) {
                console.log('Place geometry:', place.geometry.location);
                if (map) {
                    map.panTo(place.geometry.location);
                } else {
                    console.error('Map is not initialized.');
                }
            } else {
                console.error('No geometry found for the place.');
            }
        } else {
            console.error('Autocomplete is not initialized.');
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" height="100%">
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
                <Autocomplete onLoad={autocomplete => setAutocomplete(autocomplete)} onPlaceChanged={handlePlaceChanged}>
                    <TextField label="Enter a place" variant="outlined" />
                </Autocomplete>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '400px' }}
                    center={{ lat: -34.397, lng: 150.644 }}
                    zoom={8}
                    onLoad={map => setMap(map)}
                />
            </LoadScript>
        </Box>
    );
};

export default Trip;