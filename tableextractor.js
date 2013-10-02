// TableExtractor.js
// Provides functions that facilitate the access of data in HTML tables
// Requires: JQuery

// Schema for TableObj
/*
{
	headers: {'a':0 , 'b':1, 'c':2} <- where a,b,c are the column labels of the table
	
	data: [[1,2,3],[4,5,6],[7,8,9],[10,11,12]] <- a 2d array that contains lists of row information
	
	getVal: a function that retrieves a value given the row number and column name,
			provided there are no duplicate column names
}
*/
function TableObj() {
	this.headers = {};
	this.data = [];
	this.getVal = function(row, columnname) {
		return this.data[row][this.headers[columnname]];
	};
}

// Input: a JQuery Object that consists of the target table
// Output: A TableObj object
function tableToObjJ(table) {
	var outObj = new TableObj();
	// Find the headings and add to 'dictionary'
	$(table).find("tr th").each(function (index) {
		outObj.headers[$.trim($(this).text())] = index;
	});
	var lenheaders = 0;
	for (var key in outObj.headers) lenheaders++; // Check if there are headings
	if (lenheaders > 0) {
		var rows = $(table).find('tr:gt(0)'); // Start with the second row
	}
	else {
		var rows = $(table).find('tr'); // Start with the first row
	}
	$(rows).each(function() {
		var elements = [];
		$(this).find('td').each(function(ind, ele) {
			elements.push($.trim($(ele).text()));
		});
		outObj.data.push(elements);
	});
	return outObj;
}