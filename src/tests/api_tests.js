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
	console.log("Created new test trip with id: ");
	console.log(test_trip_id);
    });

    it('should update trip name', async function() {
	const response = await axios.post(`${baseUrl}/save_trip?trip_name=Updated test trip name&trip_id=` + test_trip_id, null, getAuthHeaders());
	expect(response.status).to.equal(200);
    });

    it('should add viewers and editors', async function() {
	const editors = ["editor1@example.com", "editor2@example.com"];
	// Normally frontend wouldn't allow you add your own email to
	// either list, but this allows us to test
	// get_shared_trips_list below
	const viewers = ["viewer1@example.com", user];

	const response = await axios.post(
	    `${baseUrl}/save_trip?trip_id=` + test_trip_id + "&view=" + viewers + "&edit=" + editors,
	    null,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
    });

    it('should get the trip with the correct data', async function() {
	const response = await axios.post(
	    `${baseUrl}/get_trip?trip_id=` + test_trip_id,
	    null,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
	const expected = { random_test_trip_data: 'random string' };
	expect(response.data).to.deep.equal(expected);
    });

    it('should get list of owned trips', async function() {
	const response = await axios.get(
	    `${baseUrl}/get_owned_trips_list`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);

	// We can't check the full list, because we don't know which
	// other trips will be there. So we just check that the trip
	// we added is in the list
	const expected_element = {
	    name: 'Updated test trip name',
	    uuid: test_trip_id
	}
	const found_element = response.data.find(item => item.uuid === test_trip_id);
	expect(found_element).to.deep.equal(expected_element)
    });


    it('should get list of shared trips', async function() {
	const response = await axios.get(
	    `${baseUrl}/get_shared_trips_list`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
	// We can't check the full list, because we don't know which
	// other trips will be there. So we just check that the trip
	// we added is in the list
	const expected_element = {
	    name: 'Updated test trip name',
	    uuid: test_trip_id
	}
	const found_element = response.data.find(item => item.uuid === test_trip_id);
	expect(found_element).to.deep.equal(expected_element)
    });

    it('should get the correct trip viewers', async function() {
	const response = await axios.get(
	    `${baseUrl}/get_trip_viewers?trip_id=${test_trip_id}`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
	expect(response.data.viewers).to.deep.equal([ 'viewer1@example.com', 'nweconop@uncg.edu' ])
	// console.log(response.json);
    });

    it('should get the correct trip editors', async function() {
	const response = await axios.get(
	    `${baseUrl}/get_trip_editors?trip_id=${test_trip_id}`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
	expect(response.data.editors).to.deep.equal([ 'editor1@example.com', 'editor2@example.com' ])
    });


    it('should get the correct trip name', async function() {
	const response = await axios.get(
	    `${baseUrl}/get_trip_name?trip_id=${test_trip_id}`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
	expect(response.data.trip_name).to.equal("Updated test trip name")
    });


    it('should delete the trip', async function() {
	const response = await axios.get(
	    `${baseUrl}/delete_trip?trip_id=${test_trip_id}`,
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);
    });

    it('should fail to query information about the trip after deletion', async function() {
	try {
            const response = await axios.get(
		`${baseUrl}/get_trip_name?trip_id=${test_trip_id}`,
		getAuthHeaders()
            );
            throw new Error('Expected request to fail');
	} catch (error) {
            expect(error.response.status).to.equal(404);
	}
    });

    // random user preferences
    // const user_preferences = { random: Math.random().toString(36).substring(2), data: Math.random().toString(36).substring(2) };
    const user_preferences = [ "random", Math.random().toString(36).substring(2), "data", Math.random().toString(36).substring(2)];

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

    // frontend expects a specific format for the data
    it('should reset global user preferences so it does not break the frontend', async function() {
	const response = await axios.post(
	    `${baseUrl}/save_preferences`,
	    {data: []},
	    getAuthHeaders()
	);
	expect(response.status).to.equal(200);

    });


});
