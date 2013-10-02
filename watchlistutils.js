function getCoursesFromHTML (htmldata) {
	var courseData = {
		id: data.dept+" "+data.code,
		name: "",
		sections: []
	}
	var page = $($.parseHTML(htmldata));
	// Get course name
	var cname = $(page).find('h4:first').text();
	courseData.name = $.trim(cname.replace(courseData.id,''));
	var table = $(page).find("table.section-summary");
	var tableObj = tableToObjJ(table);
	// Go through each of the course section elements
	for (var i=0; i<tableObj.data.length; i++) {
		var status = tableObj.getVal(i,'Status');
		status = (status == "") ? "Available" : status;
		var courseName = tableObj.getVal(i,'Section');
		var nameparts = courseName.split(" ");
		secNum = nameparts[2];
		var type = tableObj.getVal(i,'Activity');
		var term = tableObj.getVal(i,'Term');
		if (!courseName) {
			if (term == "2" || term == "1-2") {
				courseData.sections[courseData.sections.length-1].term = "1-2";
			}
			continue;
		}
		courseData.sections.push(
		{
			year: data.year, session: data.session, id: courseData.id,
			secNum: secNum, type: type, term: term, lastKnownStatus: status
		});
	}
	return courseData;
}