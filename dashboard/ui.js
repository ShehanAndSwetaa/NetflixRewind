function getTemplate(file) {
	return new Promise((resolve, reject) => {
		fetch(chrome.runtime.getURL(file))
			.then(response => resolve(response.text()))
			.catch(error => {
				console.error('Error loading dashboard.html template', error);
				reject(error);
			});
	});
}

function insertLogo() {
	$("#logo").attr("src", chrome.runtime.getURL("images/netflix_rewind.png"))
}

function insertEdition() {
	$("#edition").text(`${YEAR} Edition`);
}

function showEmptyOrErrorSection(error) {
	console.error(error);
	getTemplate('/dashboard/loading/error.html').then(
		errorPage => {
			replaceDocument(errorPage);
			insertLogo();
		}
	);
}

function showLoader() {
	// Loader
	getTemplate('/dashboard/loading/loading.html').then(
		loader => {
			replaceDocument(loader);
			insertLogo();
		}
	);
}

function showData(summary) {
	getTemplate('/dashboard/charts/charts.html').then(
		charts => {
			replaceDocument(charts);
			insertLogo();
			insertEdition();
			initCharts(summary);
		}
	)
}
