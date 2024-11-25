/**
 * The minimum destinations allowed per day
 * @type {number}
 */
export const MIN_DESTINATIONS_PER_DAY = 2;
/**
 * The maximum destinations allowed per day
 * @type {number}
 */
export const MAX_DESTINATIONS_PER_DAY = 5;
/**
 * Contains the variants allowed for the info message
 * @type {{SUCCESS: string, ERROR: string, INFO: string, WARNING: string}}
 */
export const INFO_MESSAGE_VARIANT = {
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
    ERROR: "error"
};

/**
 * Returns the radius in meters based on the transportation mode
 * @param {google.maps.TravelMode} transportationMode Mode of transportation
 * @returns {number} Radius in meters
 */
export const getRadiusFromTransportationMode = (transportationMode) => {
    switch (transportationMode) {
        case "DRIVING":
            return 5000;
        case "WALKING":
            return 1000;
        case "BICYCLING":
            return 2000;
        case "TRANSIT":
            return 3000;
        default:
            return 1500;
    }
};
