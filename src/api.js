const makeRequest = async (accessToken, callback) => {
  try {
    const response = await fetch('http://localhost:5556/api/private', {
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
