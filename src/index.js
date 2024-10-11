import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import reportWebVitals from './reportWebVitals';

import config from './config';

console.log(config);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
	<Auth0Provider
	    domain={config.auth0_domain}
	    clientId={config.auth0_client_id}
	    authorizationParams={{
		redirect_uri: config.frontend_endpoint,
		audience: config.auth0_audience,
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
