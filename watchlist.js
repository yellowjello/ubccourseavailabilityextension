/*
CourseList object:
{
	year: aYear,
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
		sections:
		sid: "secId",
		type: "aType",
		term: "termNum",
		lastKnownStatus: "aStatus"
	}
]
*/

/* ---------------------------- CourseList ------------------------- */
function CourseList(year, session, courses) {
	this.year = year;
	this.session = session;
	this.courses = courses;
}

// Input: courses - a list of courses
// Effect: Add provided courses into CourseList
// 		   If there is an existing course, the new course is used, with the sections merged
CourseList.prototype.addCourses(courses) {
	for (var i = 0; i < courses.length; i++) {
		var currCourse = courses[i];
		var courseIndex = findCourse(currCourse);
		if (courseIndex != null) { // There is an existing course
			currCourse.addSections(this.courses[courseIndex].sections); // Add existing sections into the replacement course
			this.courses[courseIndex] = currCourse; // Replace
		}
		else {
			this.courses.push(currCourse); // Add to list of courses
		}
	}
}

CourseList.prototype.removeCourses() {

}

// Returns flattened representation of CourseList
CourseList.prototype.flatten() {
	var flatCourseList = [];
	for (var i = 0; i < this.courses.length; i++) {
		var currCourse = this.courses[i];
		flatCourseList = flatCourseList.concat(currCourse.flatten());
	}
}

// Input: course - a course to find
// Output: index of course if found, null otherwise
CourseList.prototype.findCourse(course) {
	for (var i = 0; i < this.courses.length; i++) {
		var currCourse = this.courses[i];
		if (currCourse.isEqual(course)) {
			return i;
		}
	}
	return null;
}

/* ------------------------ Course ------------------------------ */
function Course(cid, name, sections) {
	this.cid = cid;
	this.name = name;
	this.sections = sections;
}

// Input: sections - a list of sections
// Effect: Add provided sections into course
// 		   If there is an existing section, replaced with matching section
Course.prototype.addSections(sections) {
	for (var i = 0; i < sections.length; i++) {
		var currSection = sections[i];
		var sectionIndex = findSection(currSection);
		if (sectionIndex != null) { // There is an existing section
			this.sections[sectionIndex] = currSection; // Replace
		}
		else {
			this.sections.push(currSection); // Add to list of sections
		}
	}
}

// Returns a flattened (denormalized) version of the course (array of supersections)
Course.prototype.flatten() {
	var flatCourse = [];
	for (var i = 0; i < this.sections.length; i++) {
		var currSection = this.sections[i];
		flatCourse.push({ // Create object for flat representation
			cid: this.cid,
			name: this.name,
			sid: currSection.sid,
			type: currSection.type,
			term: currSection.term,
			lastKnownStatus: currSection.lastKnownStatus
		});
	}
	return flatCourse;
}

// Input: section - a section to find in the course
// Output: index of section if found, null otherwise
Course.prototype.findSection(section) {
	for (var i = 0; i < this.sections.length; i++) {
		var currSection = this.sections[i];
		if (currSection.isEqual(section)) {
			return i;
		}
	}
	return null;
}

// Returns whether the course is equal to another course
Course.prototype.isEqual(course) {
	return this.cid == course.cid;
}


/* ------------------------ Section ---------------------------- */
function Section(sid, type, term, lastKnownStatus) {
	this.sid = sid;
	this.type = type;
	this.term = term;
	this.lastKnownStatus = lastKnownStatus;
}

// Returns whether the section is equal to another section
Section.prototype.isEqual(section) {
	return this.sid == section.sid;
}

/* -------------------------- WatchList ---------------------- */
function WatchList(courseList) {
	this.courseList = courseList;
}

// Input: courseList - a courseList object
// Effect: Merges given courseList with existing courseList
WatchList.prototype.add(courseList) {
	if (this.courseList.year != courseList.year || this.courseList.session != courseList.session) {
		throw new Error("Different year or session");
	}
	this.courseList.addCourses(courseList.courses);
}

WatchList.prototype.remove(courseList) {
	
}