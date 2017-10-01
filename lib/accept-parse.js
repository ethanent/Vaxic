// This code was written by Bennett Somerville. @bdsomer on GitHub. (Licensed as OMV2-FO)

/**
 * Returns an array, with the most preferred encoding first and the least preferred encoding last
 * @param {string} accept
 */

module.exports = function getAcceptedEncodings(acceptHeader) {

	// If the accept header is falsy, return an empty array

	if (!acceptHeader) {
		return [];
	}

	// Remove all spaces

	acceptHeader = acceptHeader.replace(/\s/g, '');

	// Turns 'gzip;q=1.0,identity,*;q=0' into ['gzip;q=1.0', 'identity', '*;q=0']

	var acceptArray = acceptHeader.split(',');

	// Check if the array is null or just [''], return [] if so

	if (acceptArray.length === 1 && acceptArray[0] === '') return [];

	/* Map the array from ['gzip;q=1.5', 'identity', '*;q=0'], for example, to
		[
			{
				'c' : 'gzip',
				'q' : 1.5
			},
			{
				'c' : 'identity',
				'q' : 1
			},
			{
				'c' : "*",
				'q' : 0
			}
		]
	*/

	acceptArray = acceptArray.map(element => {

		// Use a regular expression to get two capture groups

		const matchedEncodings = element.match(/(.+?);?q=(.+)/);

		// If there is a match, we have something like 'gzip;q=1.0', otherwise, something like 'identity'

		if (matchedEncodings) {

			// The first capture group is what is being accepted (ex. 'gzip')

			const accepted = matchedEncodings[1];

			// The second capture group is the qValue (ex. 1.0)

			const qValue = parseFloat(matchedEncodings[2]);

			// Return an object

			return {
				'c'	: accepted,
				'q' : qValue
			};
		} else {
			return {
				'c'	: element,
				'q'	: 1
			};
		}
	});

	// Remove all accepts with a qValue of 0

	acceptArray = acceptArray.filter(element => element.q !== 0);

	// Sort the array so that the highest qValues go first

	acceptArray = acceptArray.sort((a, b) => b.q - a.q);

	// Map the array to something like ['gzip', 'identiy']

	acceptArray = acceptArray.map(element => element.c);

	// Return the modified array

	return acceptArray;

};