import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
	<Auth0Provider
	    domain="dev-dvzptx3ol842v42i.us.auth0.com"
	    clientId="3Yh7IxkQBevAfahfFXYpXoRZe1g3W2Ve"
	    authorizationParams={{
		redirect_uri: "http://localhost:3000",
		audience: "https://backend-dev-263849479020.us-east1.run.app",
		useRefreshTokens: true,

	    }}
	    cacheLocation="localstorage"
	>
	<App />
	</Auth0Provider>,
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
