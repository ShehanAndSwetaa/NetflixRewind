let YEAR = 2020;
const PAGE_SIZE = 20;
let BUILD_ID = "v6ef6668d"; // last working BUILD_IDENTIFIER
let AUTH_URL = "";
const BOX_ART_RES = "_1280x720";
const BOX_ART_FORMAT = "webp";

function getEdition() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    // return previous year if January, February or March
    return (month < 3) ? year - 1 : year;
}

function getNetflixBuildId() {
    const scripts = Array.prototype.slice.call(document.scripts);
    let buildId = null;
    scripts.forEach((script, index) => {
        const buildIdIndex = script.innerHTML.indexOf('BUILD_IDENTIFIER');
        if (buildIdIndex > -1) {
            const text = script.innerHTML.substring(buildIdIndex + 19);
            buildId = text.substring(0, text.indexOf('"'));
        }
    });
    return buildId;
}

function getAUTH() {
    const scripts = Array.prototype.slice.call(document.scripts);
    let authURL = null;
    scripts.forEach((script, index) => {
        const authURLIndex = script.innerHTML.indexOf('authURL');
        if (authURLIndex > -1) {
            const text = script.innerHTML.substring(authURLIndex + 10);
            authURL = text.substring(0, text.indexOf('"'));
        }
    });
    return authURL;
}

function getNetflixData(paths) {
    let data = ""
    for (let path of paths) {
        data += 'path=' + JSON.stringify(path) + '&';
    }
    return fetch(`https://www.netflix.com/api/shakti/${BUILD_ID}/pathEvaluator?${data}authURL=${AUTH_URL}`, {
        method: "POST",
        credentials: 'same-origin',
    });
}

async function getGenres(ids) {
    const paths = ids.map(id => ["videos", id, "evidence"]);
    const response = await getNetflixData(paths);
    const data = await response.json();
    const genres = data["value"]["videos"];
    Object.keys(genres).map((key, index) => {
        genres[key] = genres[key]["evidence"]["value"];
    });
    return genres;
}

async function getBoxArt(ids) {
    const paths = ids.map(id => ["videos", id, "boxarts", [BOX_ART_RES], BOX_ART_FORMAT]);
    const response = await getNetflixData(paths);
    const data = await response.json();
    const boxArts = data["value"]["videos"];
    Object.keys(boxArts).map((key, index) => {
        boxArts[key] = boxArts[key]["boxarts"][BOX_ART_RES][BOX_ART_FORMAT]["url"];
    });
    return boxArts;
}

function getActivityPage(page) {
    return fetch(`https://www.netflix.com/api/shakti/${BUILD_ID}/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`, {
        credentials: 'same-origin',
    });
}

function getViewingActivity() {
    return new Promise((resolve, reject) => {
        let viewedItems = [];
        let loadedPages = 0;

        // Get first page of activity
        getActivityPage(0)
            .then(response => response.json()) // get data as json
            .then(data => {
                loadedPages++;
                const viewingHistorySize = data["vhSize"];

                console.log(`Viewing history size is ${viewingHistorySize}`);
                let num_pages = Math.ceil(viewingHistorySize / PAGE_SIZE);
                viewedItems = viewedItems.concat(data["viewedItems"]);

                const pageList = [];
                for (let pageNumber = 1; pageNumber < num_pages; pageNumber++) {
                    pageList.push(pageNumber);
                }

                // Executes a request for each activity page
                const promises = pageList.map(page => {
                    return getActivityPage(page)
                        .then(response => response.json())
                        .then(data => {
                            loadedPages++;
                            viewedItems = viewedItems.concat(data["viewedItems"]);
                        })
                        .catch(error => {
                            loadedPages++;
                            console.error(`Error loading activity page ${page}`, error);
                        });
                });

                // Synchronizes when all requests are resolved
                Promise.all(promises)
                    .then(response => {
                        const sortedItems = _.sortBy(viewedItems, ['date']).reverse();
                        const filteredItems = _.filter(sortedItems, x => getYear(x) === YEAR);
                        resolve(filteredItems);
                    })
                    .catch(error => {
                        console.error(`Unknown error loading viewing activity pages`, error);
                        reject(error);
                    });
            })
            .catch(error => {
                console.error("First page of viewing activity could not be fetched", error);
                reject(error);
            });
    });
}