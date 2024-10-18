import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from "react";
import { getTestMessageFromAPI } from "../api.js";

const Profile = () => {
    const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

    const [data, setData] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getAccessTokenSilently();
            // console.log("accessToken: ", accessToken);
            await getTestMessageFromAPI(accessToken, (data) => setData(data));
        };
        fetchData().catch((err) => console.error(err));
    }, [getAccessTokenSilently]);

    // console.log("isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "user:", user);

    return (
        <>
            {isLoading && <div>Loading...</div>}
            {isAuthenticated && (
                <div>
                    <img src={user.picture} alt={user.name} />
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                    <p>{data?.message}</p>
                </div>
            )}
        </>
    );
};

export default Profile;
