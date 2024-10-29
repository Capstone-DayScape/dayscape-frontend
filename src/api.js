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
        callback(data);
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

export async function postPreferencesToAPI(accessToken, preferencesList, callback) {
    try {
        if (accessToken) {
            const response = await fetch(config.backend_endpoint + "/api/public/preferences_to_types", {
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
        } else {
            const response = await fetch(config.backend_endpoint + "/api/public/preferences_to_types", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    input_list: preferencesList
                })
            });
            const data = await response.json();
            callback(data);
        }
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}
