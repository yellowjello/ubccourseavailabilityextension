/*
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

/* ---------------------------- CourseList ------------------------- */
function CourseList(year, session, courses) {
	this.year = year;
	this.session = session;
	this.courses = courses;
}

// Input: course - a course
// Effect: Add provided course into CourseList
// 		   If there is an existing course, the new course is used, with the sections merged
CourseList.prototype.addCourse = function (course) {
	var courseIndex = this.findCourse(course);
	if (courseIndex != null) { // There is an existing course
		course.addSections(this.courses[courseIndex].sections); // Add existing sections into the replacement course
		this.courses[courseIndex] = course; // Replace
	}
	else {
		this.courses.push(course); // Add to list of courses
	}
}

// Input: courses - a list of courses
// Effect: Add provided courses into CourseList
// 		   If there is an existing course, the new course is used, with the sections merged
CourseList.prototype.addCourses = function (courses) {
	for (var i = 0; i < courses.length; i++) {
		this.addCourse(courses[i]);
	}
}

CourseList.prototype.removeCourses = function () {

}

// Returns flattened representation of CourseList
CourseList.prototype.flatten = function () {
	var flatCourseList = [];
	for (var i = 0; i < this.courses.length; i++) {
		var currCourse = this.courses[i];
		flatCourseList = flatCourseList.concat(currCourse.flatten());
	}
	return flatCourseList;
}

// Input: course - a course to find
// Output: index of course if found, null otherwise
CourseList.prototype.findCourse = function (course) {
	for (var i = 0; i < this.courses.length; i++) {
		var currCourse = this.courses[i];
		if (currCourse.isEqual(course)) {
			return i;
		}
	}
	return null;
}

function toCourseList(courselist) {
	var nCourseList = new CourseList(courselist.year, courselist.session, []);
	for (var i = 0; i < courselist.courses.length; i++) {
		nCourseList.addCourse(toCourse(courselist.courses[i]));
	}
	return nCourseList;
}

/* ------------------------ Course ------------------------------ */
function Course(cid, name, sections) {
	this.cid = cid;
	this.name = name;
	this.sections = sections;
}

// Input: sections - a section object
// Effect: Add section into course
// 		   If there is an existing section, replaced with matching section
Course.prototype.addSection = function (section) {
	var sectionIndex = this.findSection(section);
	if (sectionIndex != null) { // There is an existing section
		this.sections[sectionIndex] = section; // Replace
	}
	else {
		this.sections.push(section); // Add to list of sections
	}
}

// Input: sections - a list of sections
// Effect: Add provided sections into course
// 		   If there is an existing section, replaced with matching section
Course.prototype.addSections = function (sections) {
	for (var i = 0; i < sections.length; i++) {
		this.addSection(sections[i]);
	}
}

// Returns a flattened (denormalized) version of the course (array of supersections)
Course.prototype.flatten = function () {
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
Course.prototype.findSection = function (section) {
	for (var i = 0; i < this.sections.length; i++) {
		var currSection = this.sections[i];
		if (currSection.isEqual(section)) {
			return i;
		}
	}
	return null;
}

// Returns whether the course is equal to another course
Course.prototype.isEqual = function (course) {
	return this.cid == course.cid;
}

// Turns a course with no functions into a course with functions
function toCourse(course) {
	var nCourse = new Course(course.cid, course.name, []);
	for (var i = 0; i < course.sections.length; i++) {
		nCourse.addSection(toSection(course.sections[i]));
	}
	return nCourse;
}


/* ------------------------ Section ---------------------------- */
function Section(sid, type, term, lastKnownStatus) {
	this.sid = sid;
	this.type = type;
	this.term = term;
	this.lastKnownStatus = lastKnownStatus;
}

// Returns whether the section is equal to another section
Section.prototype.isEqual = function (section) {
	return this.sid == section.sid;
}

function toSection(section) {
	return new Section(section.sid, section.type, section.term, section.lastKnownStatus);
}

/* -------------------------- WatchList ---------------------- */
function WatchList(courseList) {
	this.courseList = courseList;
}

// Input: courseList - a courseList object
// Effect: Merges given courseList with existing courseList
WatchList.prototype.add = function (courseList) {
	if (this.courseList.year != courseList.year || this.courseList.session != courseList.session) {
		throw new Error("Different year or session");
	}
	this.courseList.addCourses(courseList.courses);
}

WatchList.prototype.remove = function (courseList) {
	
}
