// This is an end-to-end test of the backend API, not the frontend
// code. To run these tests, you must do the following:

// 1. `npm start`, and log in to dayscape from your browser at
// http://localhost:3000/. To ensure that your token is not expired,
// you may want to log in AGAIN even if you were logged in when you
// opened the page

// 2. Right click > Inspect > Storage > Local Storage > http://localhost:3000/

// 3. Copy the value that looks like {"body":{"access_token":"eyJ....

// 4. Export the access_token value in your shell like this:

// export ACCESS_TOKEN="eyJ..."  # with the whole token

// 5. Export your email address like this:

// export DAYSCAPE_TESTING_USER="my.email@example.com"

// 6. Go to the backend repository and follow the instructions in the
// README to start the backend at http://localhost:5556

// 7. `npm run api_test`

import axios from 'axios';
import { expect } from 'chai';
import dotenv from 'dotenv';

dotenv.config();

describe('API Tests', function () {
    // valid access token copied from browser storage after logging in
    const token = process.env.ACCESS_TOKEN;
    // user (email) whose access token we are using
    const user = process.env.DAYSCAPE_TESTING_USER;

    // console.log("token:\n");
    // console.log(token);
    // console.log("user:\n");
    // console.log(user);

    const baseUrl = 'http://localhost:5556/api/private';

    var test_trip_id = ""

    function getAuthHeaders() {
	return {
	    headers: {
		Authorization: `Bearer ${token}`,
		Origin: 'http://localhost:3000',
		"Content-Type": "application/json"
	    }
	};
    }

    it('should access private route', async function () {
	const response = await axios.get(baseUrl, getAuthHeaders());
	expect(response.status).to.equal(200);
    });

    it('should create a new trip', async function() {
	const tripData = JSON.stringify({
	    random_test_trip_data : 'random string',
	});

	const response = await axios.post(`${baseUrl}/save_trip?trip_name=Test`, tripData, getAuthHeaders());
	expect(response.status).to.equal(200);
	// save trip ID for the following tests
	test_trip_id = response.data
    });

    it('should update trip name', async function() {
	const response = await axios.post(`${baseUrl}/save_trip?trip_name=Test new name&trip_id=` + test_trip_id, null, getAuthHeaders());
	expect(response.status).to.equal(200);
    });

    it('should add viewers and editors', async function() {
    const editors = ["editor1@example.com", "editor2@example.com"];
    const viewers = ["viewer1@example.com", "viewer2@example.com"];

    const response = await axios.post(
	`${baseUrl}/save_trip?trip_id=` + test_trip_id + "&view=" + viewers + "&edit=" + editors,
	null,
	getAuthHeaders()
    );
    expect(response.status).to.equal(200);
    });

    it('should get the request', async function() {
    const response = await axios.post(
	`${baseUrl}/get_trip?trip_id=` + test_trip_id,
	null,
	getAuthHeaders()
    );
	expect(response.status).to.equal(200);
	const expected = { random_test_trip_data: 'random string' };
	expect(response.data).to.deep.equal(expected);
    });

    // TODO: need tests here to get the editors and viewers for the
    // same trip once we implement that in the API

    // random user preferences
    const user_preferences = { random: Math.random().toString(36).substring(2), data: Math.random().toString(36).substring(2) };

    it('should save global user preferences', async function() {
    const response = await axios.post(
	`${baseUrl}/save_preferences`,
	user_preferences,
	getAuthHeaders()
    );
	expect(response.status).to.equal(200);

    });

    it('should get global user preferences', async function() {
    const response = await axios.get(
	`${baseUrl}/get_preferences`,
	getAuthHeaders()
    );
	expect(response.status).to.equal(200);
	expect(response.data).to.deep.equal(user_preferences);
    });

    // TODO: need to add tests to delete the trip we created!
});
