const config = {
    // Should be the same across all deployments
    auth0_domain: process.env.REACT_APP_AUTH0_DOMAIN ?? "dev-dvzptx3ol842v42i.us.auth0.com",

    // Defaults to the workstation Auth0 application
    auth0_client_id: process.env.REACT_APP_AUTH0_CLIENT_ID ?? "3Yh7IxkQBevAfahfFXYpXoRZe1g3W2Ve",
    frontend_endpoint: process.env.REACT_APP_FRONTEND_ENDPOINT ?? "http://localhost:3000",

    backend_endpoint: process.env.REACT_APP_BACKEND_ENDPOINT ?? "http://localhost:5556",

    // name of the Auth0 'API' we're connecting to - either dev or
    // prod backend endpoint (even when the actual backend endpoint
    // we're connecting to is localhost)
    auth0_audience: process.env.REACT_APP_AUTH0_AUDIENCE ?? "https://backend-dev-263849479020.us-east1.run.app",
};

export default config;
