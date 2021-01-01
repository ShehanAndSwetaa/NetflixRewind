// MAIN
document.documentElement.style.visibility = 'hidden';
window.addEventListener('unhandledrejection', function(promiseRejectionEvent) {
	console.error(
		`Something went wrong, sorry... but here is a trace that could help to fix the problem`,
		promiseRejectionEvent
	);
	showEmptyOrErrorSection(promiseRejectionEvent);
});

document.addEventListener('DOMContentLoaded', function() {
	document.documentElement.style.visibility = '';
	try {
		main();
	} catch (error) {
		console.error(`Something went wrong, sorry... but here is a trace that could help to fix the problem`, error);
		showEmptyOrErrorSection(error);
	}
});

// FUNCTIONS
function main() {
	// show loading page
	showLoader();
	
	// fetch necessary variables
	YEAR = getEdition();
	AUTH_URL = getAUTH();
	BUILD_ID = getNetflixBuildId() || BUILD_ID;
	console.log(`Netflix REWIND - ${YEAR} EDITION`);
	console.log(`Netflix BUILD_IDENTIFIER: ${BUILD_ID}`);
	
	// get viewing activity -> calculated statistics -> show the data
	getViewingActivity()
		.then(viewedItems => {
			calculateStats(viewedItems).then(summary => showData(summary));
		})
		.catch(error => {
			console.error('Error loading viewing activity', error);
			throw error;
		});
}
