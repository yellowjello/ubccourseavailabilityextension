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
	currWatchlist.year = data.year;
	currWatchlist.session = data.session;
	currWatchlist.addCourse(toCourse(data.course));

	// Push local watchlist to storage
	chrome.storage.sync.set({"watchlist": currWatchlist}, function() {
		callback(currWatchlist);
	});
}

// Removes multiple sections from local watchlist
function remove(data, callback) {
	// If there's no local watchlist
	if ($.isEmptyObject(currWatchlist)) {
		callback(null);
		return;
	}
	currWatchlist.removeCourseSections(data);
	chrome.storage.sync.set({"watchlist": currWatchlist}, function() {
		callback(currWatchlist);
	});
}

function updateWatchlist(callback) {
	if ($.isEmptyObject(currWatchlist)) {
		callback(null);
		return;
	}
	for (var i = 0; i < currWatchlist.courses.length; i++) {
		var currCourse = currWatchlist.courses[i];
		var parts = currCourse.cid.split(" ");
		var dept = parts[0];
		var code = parts[1];
		var url = "https://courses.students.ubc.ca/cs/main?sessyr="+currWatchlist.year+"&sesscd="+currWatchlist.session+"&pname=subjarea&tname=subjareas&req=3&dept="+dept+"&course="+code;
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				// Process course html
				var courseData = getCourseFromCoursePage(xhr.responseText, dept, code);
				currWatchlist.updateCourse(courseData);
			}
		}
		xhr.open("GET", url, true);
		xhr.send();
	}
	callback(currWatchlist);
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

function notifyWatchlist(watchlist) {
	var opt = {
		type: "list",
		title: "The following sections are available:",
		iconUrl: "icon.png",
		items: []
	}
	for (var i = 0; i < watchlist.courses.length; i++) {
		var currCourse = watchlist.courses[i];
		for (var j = 0; j < currCourse.sections.length; j++) {
			var currSection = currCourse.sections[j];
			if (currSection.lastKnownStatus == "Available") {
				opt.items.push({title: currCourse.cid, message: currSection.sid});
			}
		}
	}
	chrome.notifications.create("notice", opt, function () {});
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
	else if (message.messageType == "updateWatchlist") {
		updateWatchlist(callback);
	}
	else if (message.messageType == "getWatchlist") {
		getWatchlist(callback);
	}
	return true;
});
chrome.alarms.create("updater", {
	delayInMinutes: 1,
	periodInMinutes: 10
});
chrome.alarms.onAlarm.addListener(function (alarm) {
	if (alarm.name == "updater") {
		updateWatchlist(notifyWatchlist);
	}
});