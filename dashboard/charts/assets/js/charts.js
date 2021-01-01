// FUNCTIONS
function animateLineChart(chart) {
	chart.on('draw', function(data) {
		if (data.type === 'line' || data.type === 'area') {
			data.element.animate({
				d: {
					begin: 600,
					dur: 700,
					from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint
				}
			});
		} else if (data.type === 'point') {
			data.element.animate({
				opacity: {
					begin: 0,
					dur: 600,
					from: 0,
					to: 1,
					easing: 'ease'
				}
			});
		}
	});
}
function animateBarChart(chart) {
	chart.on('draw', function(data) {
		if (data.type === 'bar') {
			data.element.attr({style: 'stroke-width: 1.2rem'});
			data.element.animate({
				opacity: {
					begin: 0,
					dur: 600,
					from: 0,
					to: 1,
					easing: 'ease'
				}
			});
		}
	});
}
function animatePieChart(chart) {
	chart.on('draw', function(data) {
		if(data.type === 'slice') {
			data.element.animate({
				opacity: {
					begin: 0,
					dur: 600,
					from: 0,
					to: 1,
					easing: 'ease'
				}
			});
		}
	});
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hour_ranges = ["12 AM - 4 AM", "4 AM - 8 AM", "8 AM - 12 PM", "12 PM - 4 PM", "4 PM - 8 PM", "8 PM - 12 AM"];
const active_hour_message = (hour) => {
	if (0 <= hour && hour < 4) return "It's getting late, isn't it ?!?";
	if (4 <= hour && hour < 8) return "Why are you up?";
	if (8 <= hour && hour < 12) return "Early Bird";
	if (12 <= hour && hour < 16) return "Lunch Break?";
	if (16 <= hour && hour < 20) return "Great time to relax!";
	if (20 <= hour && hour < 24) return "Night Owl";
	return null;
}

function initCharts(data) {
	populateStats(data);
	drawWeeklyUsage(data);
	drawDailyUsage(data);
	populateBinged(data);
	drawTopGenres(data);
	drawMonthlyUsage(data);
}

function populateStats(data) {
	// Active Time
	$("#active_time").text(getHourText(data.activeHour));
	$("#active_hour_msg").text(active_hour_message(data.activeHour) || "");
	
	// Total Time
	$("#total_time").text(data.totalTimeMinutes);
	
	// Show Count
	$("#shows").text(data.seriesCount);
	
	// Movie Count
	$("#movies").text(data.moviesCount);
	
	// Devices
	$("#devices").text(data.deviceCount);
}

function drawWeeklyUsage(data) {
	let dataAvgTimeByDayWeek = {
		labels: days,
		series: days.map(day => data.avgTimeByDayWeek[day])
	};
	
	let optionsPreferences = {
		height: '230px',
		donut: true
	};
	
	const pieChart = Chartist.Pie('#avgTimeByDayWeek', dataAvgTimeByDayWeek, optionsPreferences);
	animatePieChart(pieChart);
}

function drawDailyUsage(data) {
	const activeHours = {
		labels: hour_ranges,
		series: [hour_ranges.map(hour_range => data.dailyUsage[hour_range] || 0)],
	};
	
	const optionsBarChart = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false,
		},
		height: '230px',
		chartPadding: 25,
		plugins: [
			Chartist.plugins.ctAxisTitle({
				axisY: {
					axisTitle: 'Activity Count',
					axisClass: 'ct-axis-y-title',
					offset: {
						x: 0,
						y: 10
					},
					textAnchor: 'middle',
					flipTitle: true
				}
			})
		]
	};
	const barChart = Chartist.Bar('#activeHours', activeHours, optionsBarChart);
	animateBarChart(barChart);
}

function populateBinged(data) {
	const bingedSeries = data.bingedSeries;
	if (bingedSeries.length > 2 && bingedSeries[2]["rating"] > 0) {
		let series_ids = [];
		for (let i = 0; i < 3; ++i) {
			$(`#show${i}`).text(bingedSeries[i]["title"]);
			series_ids.push(bingedSeries[i]["series"]);
		}

		getBoxArt(series_ids)
			.then(boxArts => {
				for (let i = 0; i < 3; ++i) {
					const img_url = boxArts[series_ids[i]];
					if (img_url) {
						$(`#show${i}_img`).attr("src", img_url);
					}
				}
			}).catch(e => $("#bingedShows").hide());
	} else {
		// don't show binged shows
		$("#bingedShows").hide();
	}
}

function drawTopGenres(data) {
	const genreRatings = data.genreRatings.slice(0, 5);
	const dataGenreRatings = {
		labels: genreRatings.map(x => x["genre"]),
		series: [genreRatings.map(x => x["rating"])],
	};
	
	const optionsBarChart = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false
		},
		axisY: {
			labelInterpolationFnc: function(value, index) {
				return null;
			},
		},
		height: '300px',
		chartPadding: 70,
	};
	const responsiveOptionsBarChart = [
		['screen and (max-width: 640px)', {
			seriesBarDistance: 5,
			axisX: {
				labelInterpolationFnc: function(value) {
					return value[0];
				}
			}
		}]
	];
	const barChart = Chartist.Bar('#topGenres', dataGenreRatings, optionsBarChart, responsiveOptionsBarChart);
	animateBarChart(barChart);
}

function drawMonthlyUsage(data) {
	const dataHoursPerMonth = {
		labels: months,
		series: [months.map(month => data.hoursPerMonth[month] || 0)],
	};
	
	const optionsRoundedLineChart = {
		lineSmooth: Chartist.Interpolation.cardinal({
			tension: 0
		}),
		axisY: {
			showGrid: true,
		},
		axisX: {
			showGrid: false,
		},
		low: 0,
		showPoint: false,
		showArea: true,
		height: '300px',
		chartPadding: 10,
		plugins: [
			Chartist.plugins.ctAxisTitle({
				axisY: {
					axisTitle: 'Hours',
					axisClass: 'ct-axis-y-title',
					offset: {
						x: 0,
						y: 10
					},
					textAnchor: 'middle',
					flipTitle: true
				}
			})
		]
	};
	
	const lineChart = new Chartist.Line('#hoursPerMonth', dataHoursPerMonth, optionsRoundedLineChart);
	animateLineChart(lineChart);
}
