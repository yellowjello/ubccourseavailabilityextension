/*
All message objects will be of the following form:
{ messageType: "aType", data: { (message data) } }

Watchlist object: (proposed)
{
	courses:
	[
		{	<- Course Object
			year: aYear,
			session: "S or W",
			id: "courseID",
			name: "name",
			sections:
			[
				{	<- Section Object
					secNum: aNum,
					type: "aType",
					term: "termNum:,
					lastKnownStatus: "aStatus"
				}
			]
		}
	]
}
				
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
	console.log(month)
	$("#yearsel").val(selectedyear);
	$("#sessionsel").val(selectedsession);
}

// Checks all checkboxes
function checkAll() {
	var isChecked = document.getElementById("selectall").checked;
	var checkboxes = document.querySelectorAll("#courselist input[type='checkbox']");
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = isChecked;
	}
}

// Creates watchlist
function outputWatchlist(watchlist) {
	var outputText = "";
	if (watchlist.sections.length > 0) {
		outputText += "<b>Watchlist</b><br><table id='watchlist'><tr><th>Section</th><th>Status</th></tr>";
		for (var i = 0; i < watchlist.sections.length; i++) {
			outputText += "<tr><td title='Term "+watchlist.sections[i].term+", "+watchlist.sections[i].type+"'>"+watchlist.sections[i].id+" "+watchlist.sections[i].secNum+"</td><td title='"+watchlist.sections[i].lastKnownStatus+"'>"+watchlist.sections[i].lastKnownStatus+"</td></tr>";
		}
		document.getElementById("watchdiv").innerHTML = outputText;
	}
}

// Restore pagestate data
function updatePageState() {
	localStorage["selyear"] = $("#yearsel").val();
	localStorage["selsession"] = $("#sessionsel").val();
	localStorage["query"] = document.getElementById("search").value;
}

function clearPageState() {
	localStorage["query"] = null;
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
		currCourse = response;
		var outputText = "";
		outputText += "<b>"+response.cid+": "+response.name+"</b>";
		outputText += "<table id='courselist'><tr><th><input type='checkbox' id='selectall'></input></th><th>Section</th><th>Type</th><th>Term</th><th>Status</th></tr>";
		for (var i = 0; i < response.sections.length; i++) {
			outputText += "<tr><td><input type='checkbox'></input></td><td>"+response.sections[i].sid+"</td><td>"+response.sections[i].type+"</td><td>"+response.sections[i].term+"</td><td>"+response.sections[i].lastKnownStatus+"</td></tr>";
		}
		outputText += "</table><button id='add'>Add to Watchlist</button>";
		document.getElementById("resulttext").innerHTML = outputText;
		document.getElementById("selectall").addEventListener('change', checkAll);
		document.getElementById("add").addEventListener('click', addSelected);
	}
	else {
		document.getElementById("resulttext").innerHTML = "Course unavailable or invalid";
	}
}

// Collects selected sections + sends to background.js
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
			data: watchCourse
		},
		updateAdded);
		document.getElementById("resulttext").innerHTML = "Adding selected sections...";
	}
}
function updateAdded(response) {
	watchlist = response;
	outputWatchlist(response);
	document.getElementById("resulttext").innerHTML = "Successfully added sections";
}

/* -------------- Stuff executed on page load -------------------- */
var currCourse;
var watchlist;
// Stuff to do when pop-up loaded
document.addEventListener('DOMContentLoaded', function () {
	// Attach checkavail to button
	document.getElementById("check").addEventListener('click', searchSubmit);
	// Add session selector
	addSessionOptions();
	
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
