function getCourseFromCoursePage (htmldata, dept, code) {
	var page = $($.parseHTML(htmldata));
	// Get course name
	var cid = dept+" "+code;
	var cname = $(page).find('h4:first').text();
	courseName = $.trim(cname.replace(cid,''));

	var courseData = new Course(cid, courseName, []);

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
		var sectionData = new Section(secNum, type, term, status);
		courseData.addSection(sectionData);
	}
	return courseData;
}