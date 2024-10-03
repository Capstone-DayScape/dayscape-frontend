import React, { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { GoogleMap, LoadScript, Autocomplete } from '@react-google-maps/api';

const Trip = () => {
    const [place, setPlace] = useState(null);
    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

    useEffect(() => {
        if (autocomplete) {
            console.log('Autocomplete is initialized:', autocomplete);
        } else {
            console.log('Autocomplete is not initialized yet.');
        }
    }, [autocomplete]);

    const handlePlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            setPlace(place);
            if (place.geometry) {
                map.panTo(place.geometry.location);
            }
        } else {
            console.error('Autocomplete is not initialized.');
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" height="100%">
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={['places']}>
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