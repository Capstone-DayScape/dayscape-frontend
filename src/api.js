// Example code to call an endpoint on the private part of the API
import config from './config';

const makeRequest = async (accessToken, callback) => {
  try {
    const response = await fetch(config.backend_endpoint + '/api/private', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${accessToken}`,
	  'Content-Type': 'text/html',
      }
    });
      const data = await response.json();
      console.log("Data response form API: ", data)
    callback(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

export default makeRequest;
