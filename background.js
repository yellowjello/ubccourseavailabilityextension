/*
All message objects will be of the following form:
{ messageType: "aType", data: { (message data) } }

CourseList object:
{
	year: "aYear",
	session: "S or W",
	courses:
	[
		{	<- Course Object
			cid: "courseID",
			name: "name",
			sections:
			[
				{	<- Section Object
					sid: "secId",
					type: "aType",
					term: "termNum",
					lastKnownStatus: "aStatus"
				}
			]
		}
	]
}
Flattened CourseList:
[
	{
		cid: "courseID",
		name: "name",
		sid: "secId",
		type: "aType",
		term: "termNum",
		lastKnownStatus: "aStatus"
	}
]
*/

/* ------------------------------- Message functions ------------------------------ */
// Goes to course page + scrapes data
function search(data, callback) {
	var url = "https://courses.students.ubc.ca/cs/main?sessyr="+data.year+"&sesscd="+data.session+"&pname=subjarea&tname=subjareas&req=3&dept="+data.dept+"&course="+data.code;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			// Process course html
			var courseData = getCourseFromCoursePage(xhr.responseText, data.dept, data.code);
			callback(courseData);
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

// Adds selected course (w/ sections) to local watchlist + saves
function add(data, callback) {
	// Check if there is a local watchlist
	if ($.isEmptyObject(currWatchlist)) {
		currWatchlist = new CourseList(data.year, data.session, []);
		currWatchlist.addCourse(toCourse(data.course));
	}
	else {
		console.log(toCourse(data.course));
	}
	currWatchlist.addCourse(toCourse(data.course));

	// Push local watchlist to storage
	chrome.storage.sync.set({"watchlist": currWatchlist}, function() {
		callback(currWatchlist);
	});
}

// Removes (one) section from local watchlist
function remove(data, callback) {
	// If there's no local watchlist
	if (!currWatchlist) {
		callback(currWatchlist);
		return;
	}
	var index = findSame(data.section, currWatchlist);
	if (index != null) {
		array.splice(index,1);
	}
	chrome.storage.sync.set({"watchlist": currWatchlist}, function() {
		callback(currWatchlist);
	});
}

// Retrieves watchlist
function getWatchlist(callback) {
	if ($.isEmptyObject(currWatchlist)) {
		callback(null);
	}
	else {
		callback(currWatchlist);
	}
}
/* --------------------------- Helper functions --------------------------- */
// Returns null or index
function findSame(section, watchlist) {
	for (var i = 0; i < watchlist.sections.length; i++) {
		if (watchlist.sections[i].year == section.year && watchlist.sections[i].session == section.session && watchlist.sections[i].id == section.id && watchlist.sections[i].secNum == section.secNum) {
			return i;
		}
	}
	return null;
}

/* --------------------------- Executed on script load --------------------------- */
// Load saved watchlist
var currWatchlist;
chrome.storage.sync.get("watchlist", function(data) {
	if ($.isEmptyObject(data)) {
		currWatchlist = data;
	}
	else {
		currWatchlist = toCourseList(data.watchlist);
	}
});
// Handles messages sent by extension
chrome.extension.onMessage.addListener(function(message, sender, callback) {
	if (message.messageType == "search") {
		search(message.data, callback);
	}
	else if (message.messageType == "add") {
		add(message.data, callback);
	}
	else if (message.messageType == "remove") {
		remove(message.data, callback);
	}
	else if (message.messageType == "getWatchlist") {
		getWatchlist(callback);
	}
	return true;
});