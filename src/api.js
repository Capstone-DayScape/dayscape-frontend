import config from "./config";
import axios from "axios";

export async function getTestMessage(accessToken, callback) {
    try {
        const response = await axios.get(config.backend_endpoint + "/api/private", {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "text/html" }
        });
        callback(response.data);
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * Sends preferences (tags) to the backend. Responds with `{matched_list: string[]}` within callback.
 * @param {string|null} accessToken `null` if not authenticated
 * @param {string[]} preferencesList List of tags
 * @param {function} callback Callback on success
 * @returns {Promise<void>} Promise to complete
 */
export async function translatePreferencesToTypes(accessToken, preferencesList, callback) {
    try {
        if (accessToken) {
            const response = await axios.post(
                config.backend_endpoint + "/api/public/preferences_to_types",
                { input_list: preferencesList },
                { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
            );
            callback(response.data);
        } else {
            const response = await axios.post(
                config.backend_endpoint + "/api/public/preferences_to_types",
                { input_list: preferencesList },
                { headers: { "Content-Type": "application/json" } }
            );
            callback(response.data);
        }
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * Saves the user's global preferences. Returns `string` (message) within callback.
 * @param {string} accessToken Access token
 * @param {string[]} preferencesList List of tags
 * @param {function} callback Callback on success
 * @returns {Promise<void>} Promise to complete
 */
export async function saveUserPreferences(accessToken, preferencesList, callback) {
    try {
        const response = await axios.post(
            config.backend_endpoint + "/api/private/save_preferences",
            { data: preferencesList },
            {
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
            }
        );
        callback(response.data);
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * Gets the user's global preferences. Returns `{data: string[]}` or `{}` within callback.
 * @param {string} accessToken Access token
 * @param {function} callback Callback on success
 * @returns {Promise<void>} Promise to complete
 */
export async function getUserPreferences(accessToken, callback) {
    try {
        const response = await axios.get(config.backend_endpoint + "/api/private/get_preferences", {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });
        callback(response.data);
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * Saves the current trip. Returns `string` (id) within callback.
 * @param {string} accessToken Access Token
 * @param {{data: *, name:string, id:string}} tripInfo Information used to send request
 * @param {function} callback Callback on success
 * @returns {Promise<void>} Promise to complete
 */
export async function saveTrip(accessToken, tripInfo, callback) {
    try {
        if (tripInfo.id) {
            const response = await axios.post(
                config.backend_endpoint +
                    "/api/private/save_trip?trip_name=" +
                    tripInfo.name +
                    "&trip_id=" +
                    tripInfo.id,
                tripInfo.data,
                {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                }
            );
            callback(response.data);
        } else {
            const response = await axios.post(
                config.backend_endpoint + "/api/private/save_trip?trip_name=" + tripInfo.name,
                tripInfo.data,
                {
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
                }
            );
            callback(response.data);
        }
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

// /**
//  * Gets the trip with the trip id. Returns `[Object json]` data of trip within callback.
//  * @param {string} accessToken Access Token
//  * @param {string} tripId Trip's ID
//  * @param {function} callback Callback on success
//  * @returns {Promise<void>} Promise to complete
//  */
// export async function getTrip(accessToken, tripId, callback) {
//     try {
//         const response = await axios.get(config.backend_endpoint + "/api/private/get_trip?trip_id=" + tripId, {
//             headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
//         });
//         callback(response.data);
//     } catch (error) {
//         throw new Error(`Error: ${error.message}`);
//     }
// }
