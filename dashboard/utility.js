/**
 * Replace current document with passed newContent
 * @param {*} newContent
 */
function replaceDocument(newContent) {
	document.open();
	document.write(newContent);
	document.close();
}

/**
 * Return viewing date of the passed element
 * by stripping out the time information
 * @param {*} element
 */
function getDate(element) {
	const date = new Date(element["date"]);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
}

/**
 * Return viewing year of the passed element
 * @param {*} element
 */
function getYear(element) {
	return new Date(element["date"]).getFullYear();
}

/**
 * Return viewing hour of the passed element
 * @param {*} element
 */
function getHour(element) {
	const date = new Date(element["date"]);
	return date.getHours();
}

/**
 * Return viewing hour of the passed element
 * @param {*} hour
 */
function getHourText(hour) {
	hour = parseInt(hour);
	if (hour === 0) { return "12 AM"; }
	else if (hour < 12) { return `${hour} AM`; }
	else if (hour === 12) { return `12 PM`; }
	else { return `${hour-12} PM`; }
}

/**
 * Return minutes from seconds
 * @param {*} seconds
 */
function secondsToMinutes(seconds) {
	return Math.round(seconds / 60);
}

/**
 * Return hours from seconds
 * @param {*} seconds
 */
function secondsToHours(seconds) {
	return seconds / 3600;
}
