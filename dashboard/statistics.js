const summary = {
	totalTimeMinutes: 0,
	deviceCount: 0,
	moviesCount: 0,
	seriesCount: 0,
	episodesCount: 0,
	activeHour: 0,
	activeHourRange: "",
	dailyUsage: {},
	avgTimeByDayWeek: {},
	hoursPerMonth: {},
	bingedSeries: [],
	genreRatings: [],
};
const WEEK_DAYS = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat',
};
const MONTHS = {
	0: 'Jan',
	1: 'Feb',
	2: 'Mar',
	3: 'Apr',
	4: 'May',
	5: 'Jun',
	6: 'Jul',
	7: 'Aug',
	8: 'Sep',
	9: 'Oct',
	10: 'Nov',
	11: 'Dec',
};
const HOUR_MAP = {
	0:  "12 AM - 4 AM",
	1:  "12 AM - 4 AM",
	2:  "12 AM - 4 AM",
	3:  "12 AM - 4 AM",
	4:  "4 AM - 8 AM",
	5:  "4 AM - 8 AM",
	6:  "4 AM - 8 PM",
	7:  "4 AM - 8 PM",
	8:  "8 AM - 12 PM",
	9:  "8 AM - 12 PM",
	10: "8 AM - 12 PM",
	11: "8 AM - 12 PM",
	12: "12 PM - 4 PM",
	13: "12 PM - 4 PM",
	14: "12 PM - 4 PM",
	15: "12 PM - 4 PM",
	16: "4 PM - 8 PM",
	17: "4 PM - 8 PM",
	18: "4 PM - 8 PM",
	19: "4 PM - 8 PM",
	20: "8 PM - 12 AM",
	21: "8 PM - 12 AM",
	22: "8 PM - 12 AM",
	23: "8 PM - 12 AM",
}

/**
 * Calculate stats based on viewed items
 */
async function calculateStats(viewedItems) {
	// Frequency of starts by hour
	const activeHourGroup = _.groupBy(viewedItems, viewedItem => {
		return getHour(viewedItem);
	});
	const activeHourMap = _.reduce(
		activeHourGroup,
		(result, value, key) => {
			result[key] = value.length;
			return result;
		},
		{}
	);
	const dailyUsageGroup = _.groupBy(viewedItems, viewedItem => {
		return HOUR_MAP[getHour(viewedItem)];
	});
	const dailyUsage = _.reduce(
		dailyUsageGroup,
		(result, value, key) => {
			result[key] = value.length;
			return result;
		},
		{}
	);

	
	// Time by day week
	const avgTimeByDayWeekGroup = _.groupBy(viewedItems, viewedItem => {
		return new Date(viewedItem["date"]).getDay();
	});
	const avgTimeByDayWeek = _.reduce(
		avgTimeByDayWeekGroup,
		(result, value, key) => {
			const timeByDate = _.reduce(
				_.groupBy(value, getDate),
				(result, value, key) => {
					result[key] = _.sumBy(value, 'duration');
					return result;
				},
				{}
			);

			result[WEEK_DAYS[key]] = (_.sum(_.values(timeByDate)) / _.size(timeByDate)).toFixed();
			return result;
		},
		{}
	);
	
	// Hours per month
	const hoursPerMonthGroup = _.groupBy(viewedItems, viewedItem => {
		return new Date(viewedItem["date"]).getMonth();
	});
	const hoursPerMonth = _.reduce(
		hoursPerMonthGroup,
		(result, value, key) => {
			result[MONTHS[key]] = secondsToHours(_.sumBy(value, 'duration'));
			return result;
		},
		{}
	);
	
	// Episodes
	const episodes = _.filter(viewedItems, function(item) {
		return _.has(item, 'series');
	});
	
	// Series
	const series = _.groupBy(episodes, 'seriesTitle');
	
	// Device Types
	const deviceTypes = _.groupBy(viewedItems, 'deviceType');
	
	// Movies
	const movies = _.filter(viewedItems, function(item) {
		return !_.has(item, 'series');
	});
	
	// Binged Series
	const bingeRatingMap = _.reduce(
		series,
		(result, value, key) => {
			result[key] = {
				title: key,
				series: value[0].series,
				rating: 0
			};
			if (value.length >= 5) { // show was binged
				const total_duration_seconds = _.sumBy(value, 'duration');
				const show_start = new Date(value[value.length-1]['date']);
				const show_end = new Date(value[0]['date']);
				const time_to_watch_seconds = (show_end - show_start) / 1000;
				result[key]["rating"] = total_duration_seconds / time_to_watch_seconds;
			}
			return result;
		},
		{}
	);
	const bingedSeries = _.sortBy(Object.values(bingeRatingMap), ['rating']).reverse()
	
	// Genres
	const series_ids = Object.keys(_.groupBy(episodes, 'series'));
	const movie_ids = Object.keys(_.groupBy(movies, 'movieID'))
	const series_genres = await getGenres(series_ids);
	const movie_genres = await getGenres(movie_ids);
	
	const seriesGenreDurationMap = _.reduce(
		series,
		(result, value, key) => {
			const series_id = value[0].series;
			const genres = series_genres[series_id];
			if (genres) {
				const duration = _.sumBy(value, 'duration');
				for (let genre of genres) {
					if (result[genre]) {
						result[genre] += duration;
					} else {
						result[genre] = duration;
					}
				}
			}
			return result;
		},
		{}
	);
	const movieGenreDurationMap = _.reduce(
		movies,
		(result, value, key) => {
			const movie_id = value["movieID"];
			const genres = movie_genres[movie_id];
			if (genres) {
				const duration = value["duration"];
				for (let genre of genres) {
					if (result[genre]) {
						result[genre] += duration;
					} else {
						result[genre] = duration;
					}
				}
			}
			return result;
		},
		{}
	);
	const genreDurationMap = {};
	for (let [key, value] of Object.entries(seriesGenreDurationMap)) {
		if (genreDurationMap[key]) { genreDurationMap[key] += value; }
		else { genreDurationMap[key] = value; }
	}
	for (let [key, value] of Object.entries(movieGenreDurationMap)) {
		if (genreDurationMap[key]) { genreDurationMap[key] += value; }
		else { genreDurationMap[key] = value; }
	}
	const genreRatings = _.sortBy(Object.entries(genreDurationMap), 1).reverse().map(tuple => {
		return { "genre": tuple[0], "rating": tuple[1] }
	});
	
	summary.totalTimeMinutes = secondsToMinutes(_.sumBy(viewedItems, 'duration'));
	summary.deviceCount = Object.keys(deviceTypes).length;
	summary.moviesCount = movies.length;
	summary.seriesCount = Object.keys(series).length;
	summary.episodesCount = episodes.length;
	summary.activeHour = _.maxBy(_.keys(activeHourMap), o => activeHourMap[o]);
	summary.activeHourRange = _.maxBy(_.keys(dailyUsage), o => dailyUsage[o]);
	summary.dailyUsage = dailyUsage;
	summary.avgTimeByDayWeek = avgTimeByDayWeek;
	summary.hoursPerMonth = hoursPerMonth;
	summary.bingedSeries = bingedSeries;
	summary.genreRatings = genreRatings;
	
	console.log('Activity Summary', summary);
	
	return summary;
}
