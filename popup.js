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

/* ----------------------- Page helper functions -------------------------------- */
// Generates Session selects
function addSessionOptions() {
	var date = new Date();
	var curryear = date.getFullYear();
	var month = date.getMonth();
	var optionstring = "<option value='"+(curryear-1)+"'>"+(curryear-1)+"</option><option value='"+curryear+"'>"+curryear+"</option>";
	$("#yearsel").append(optionstring);
	if (localStorage["selyear"] && localStorage["selsession"]) {
		var selectedyear = localStorage["selyear"];
		var selectedsession = localStorage["selsession"];
	}
	else {
		var selectedyear = (month == 0) ? curryear-1 : curryear;
		var selectedsession = (month >= 2 && month <= 5) ? "S" : "W";
	}
	$("#yearsel").val(selectedyear);
	$("#sessionsel").val(selectedsession);
}

// Checks all checkboxes
function checkAll(id) {
	//var isChecked = document.getElementById("selectall").checked;
	var isChecked = this.checked;
	//var checkboxes = document.querySelectorAll("#courselist input[type='checkbox']");
	var checkboxes = $(this).parents("tr").siblings().find("input[type='checkbox']");
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = isChecked;
	}
}

// Creates watchlist
function outputWatchlist(watchlist) {
	var outputText = "";
	if (watchlist.length > 0) {
		outputText += "<b>Watchlist</b><br><table id='watchlist'><tr><th><input type='checkbox' class='selectall'></input></th><th>Section</th><th>Status</th></tr>";
		for (var i = 0; i < watchlist.length; i++) {
			outputText += "<tr><td><input type='checkbox'></input></td><td title='Term "+watchlist[i].term+", "+watchlist[i].type+"'>"+watchlist[i].cid+" "+watchlist[i].sid+"</td><td title='"+watchlist[i].lastKnownStatus+"'>"+watchlist[i].lastKnownStatus+"</td></tr>";
		}
		outputText += "</table><button id='remove'>Remove from Watchlist</button>";
		document.getElementById("watchdiv").innerHTML = outputText;
		$(".selectall").each(function () { this.addEventListener('change', checkAll); });
		document.getElementById("remove").addEventListener('click', removeSelected);
	}
	else {
		document.getElementById("watchdiv").innerHTML = "";
	}
}

// Restore pagestate data
function updatePageState() {
	localStorage["selyear"] = $("#yearsel").val();
	localStorage["selsession"] = $("#sessionsel").val();
	localStorage["query"] = document.getElementById("search").value;
}

function clearPageState() {
	localStorage["query"] = "";
}

/* ---------- Functions that send + receive messages from background.js ---------- */
// Sends search message
function searchSubmit() {
	var query = document.getElementById("search").value;
	query = query.trim();
	var terms = query.split(" ");
	if (terms.length < 2) {
		document.getElementById("resulttext").innerHTML = "Enter the complete course code";
		return;
	}
	var year = $("#yearsel").val();
	var session = $("#sessionsel").val();
	var dept = terms[0].toUpperCase();
	var code = terms[1];
	chrome.extension.sendMessage({
		messageType: "search",
		data: {
			year: year,
			session: session,
			dept: dept,
			code: code
		}},
		updateSearch);
	document.getElementById("resulttext").innerHTML = "Searching "+dept+" "+code+"...";
	clearPageState();
}
// Handles search response
function updateSearch(response) {
	if (response.sections.length > 0) {
		currCourse = toCourse(response);
		currCourse.prototype = Course.prototype;
		var outputText = "";
		outputText += "<b>"+response.cid+": "+response.name+"</b>";
		outputText += "<table id='courselist'><tr><th><input type='checkbox' class='selectall'></input></th><th>Section</th><th>Type</th><th>Term</th><th>Status</th></tr>";
		for (var i = 0; i < response.sections.length; i++) {
			outputText += "<tr><td><input type='checkbox'></input></td><td>"+response.sections[i].sid+"</td><td>"+response.sections[i].type+"</td><td>"+response.sections[i].term+"</td><td>"+response.sections[i].lastKnownStatus+"</td></tr>";
		}
		outputText += "</table><button id='add'>Add to Watchlist</button>";
		document.getElementById("resulttext").innerHTML = outputText;
		$(".selectall").each(function () { this.addEventListener('change', checkAll); });
		document.getElementById("add").addEventListener('click', addSelected);
	}
	else {
		document.getElementById("resulttext").innerHTML = "Course unavailable or invalid";
	}
}

// Collects selected sections + sends to background.js to be added to watchlist
function addSelected() {
	if (!currCourse) return;
	var watchCourse = new Course(currCourse.cid, currCourse.name, []);
	var checkboxes = document.querySelectorAll("#courselist td input[type='checkbox']");
	if (checkboxes.length > 0) {
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked) {
				watchCourse.addSection(currCourse.sections[i]);
			}
		}
	}
	if (watchCourse.sections.length > 0) {
		chrome.extension.sendMessage(
		{
			messageType: "add",
			data: {year: $("#yearsel").val(), session: $("#sessionsel").val(), course: watchCourse}
		},
		function (response) {
			showWatchlist(response);
			document.getElementById("resulttext").innerHTML = "Successfully added sections";
		});
		document.getElementById("resulttext").innerHTML = "Adding selected sections...";
	}
}

// Collects selected sections + sends to background.js to be removed from watchlist
function removeSelected() {
	if (!currWatchlist) return;
	var toRemove = [];
	var checkboxes = document.querySelectorAll("#watchlist td input[type='checkbox']");
	if (checkboxes.length > 0) {
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked) {
				toRemove.push(currWatchlist[i]);
			}
		}
	}
	if (toRemove.length > 0) {
		chrome.extension.sendMessage(
		{
			messageType: "remove",
			data: toRemove
		},
		function (response) {
			showWatchlist(response);
		});
	}
}
function showWatchlist(response) {
	if (!response) return;
	var watchlist = toCourseList(response);
	currWatchlist = watchlist.flatten();
	outputWatchlist(currWatchlist);
}
// Retrieves watchlist from background.js
function loadWatchlist() {
	chrome.extension.sendMessage(
	{
		messageType: "getWatchlist",
		data: {}
	},
	showWatchlist);	
}

/* -------------- Stuff executed on page load ------------------------------ */
var currCourse;
var currWatchlist;
// Stuff to do when pop-up loaded
document.addEventListener('DOMContentLoaded', function () {
	// Attach checkavail to button
	document.getElementById("check").addEventListener('click', searchSubmit);
	// Add session selector
	addSessionOptions();

	// Show watchlist (if there is one)
	loadWatchlist();
	
	// Restore textbox
	if (localStorage["query"]) {
		document.getElementById("search").value = localStorage["query"];
	}
	// Focus search textbox
	$("#search").focus();
	
	// Check when pressed enter
	$("#search").keyup(function(e){
		if(e.keyCode == 13){
			$("#check").click();
		}
		else {
			updatePageState();
		}
	});
});
