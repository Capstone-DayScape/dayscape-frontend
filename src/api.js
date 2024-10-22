// Example code to call an endpoint on the private part of the API
import config from "./config";

export async function getTestMessageFromAPI(accessToken, callback) {
    try {
        const response = await fetch(config.backend_endpoint + "/api/private", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/html"
            }
        });
        const data = await response.json();
        // console.log("Data response from API: ", data);
        callback(data);
    } catch (error) {
        console.error("Error:", error);
    }
}

export async function postPreferencesToAPI(accessToken, preferencesList, callback) {
    try {
        const response = await fetch(config.backend_endpoint + "/api/private/preferences_to_types", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input_list: preferencesList
            })
        });
        const data = await response.json();
        callback(data);
    } catch (error) {
        throw Error("Backend is not responding: " + error.message);
    }
}
