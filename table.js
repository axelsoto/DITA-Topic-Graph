
function drawTable(data, tableid, dimensions, valueFunc, textFunc, clusterFunc, columns) {

    var sortValueAscending = function (a, b) { 
		if ((a==null)||(b==null))
			{return a==null?true:false}
		else
			{return valueFunc(a) - valueFunc(b) }
	}
    var sortValueDescending = function (a, b) { return valueFunc(b) - valueFunc(a) }
    var sortNameAscending = function (a, b) { return textFunc(a).localeCompare(textFunc(b)); }
    var sortNameDescending = function (a, b) { return textFunc(b).localeCompare(textFunc(a)); }
	var sortClusterAscending = function (a, b) { return clusterFunc(a).localeCompare(clusterFunc(b)); }
    var sortClusterDescending = function (a, b) { return clusterFunc(b).localeCompare(clusterFunc(a)); }
    var metricAscending = true;
    var nameAscending = true;
	var clusterAscending = true;

    var width = dimensions.width + "px";
    var height = dimensions.height + "px";
    var twidth = (dimensions.width - 25) + "px";
    var divHeight = (dimensions.height - 60) + "px";

    var outerTable = d3.select(tableid).selectAll(".outerTable")
	.data([0]).enter().append("table")
	.attr("class","outerTable").attr("width", width);

    outerTable
		.append("tr")
		.append("td")
        .append("table").attr("class", "headerTable").attr("width", twidth)
        .append("tr").style("cursor","pointer")
		.selectAll("th").data(columns).enter()
		.append("th")
		.text(function (column) { return column; })
		.attr("class",function(d){return d.slice(0,3);})
        .on("click", function (d) {
            var sort;
			
            // Choose appropriate sorting function.
            if (d === columns[0]) {
                if (metricAscending) sort = sortValueAscending;
                else sort = sortValueDescending;
                metricAscending = !metricAscending;
            /*} else if(d === columns[1]) {
                if (nameAscending) sort = sortNameAscending;
                else sort = sortNameDescending;
                nameAscending = !nameAscending;
            } else if(d === columns[2]) {*/
            } else if(d === columns[1]) {
                if (clusterAscending) sort = sortClusterAscending;
                else sort = sortClusterDescending;
                clusterAscending = !clusterAscending;
			}
            var rows = tbody.selectAll("tr").sort(sort);
        });

    var inner = outerTable
		.append("tr")
		.append("td")
		.append("div").attr("class", "scroll").attr("width", width).attr("style", "height:" + divHeight + ";")
		.append("table").attr("class", "bodyTable").attr("border", 0).attr("width", twidth).attr("height", height).attr("style", "table-layout:fixed");

    var tbody = inner.append("tbody").attr("class","tbodyToReplace");
    // Create a row for each object in the data 
	
		//If we want documents to be initially sorted add ".sort(sortValueAscending)" after data(data)!
    var rows = d3.select(tableid).select(".tbodyToReplace")
				.selectAll("tr")
				.data(data)
				.attr("class",function(d){
					if (obj1.isNodeClicked(d.docId)){
						return "selected";
					}
					else{
						return "unselected"
					}
				});
	
	var newRows = rows.enter().append("tr")
	.attr("class",function(d){
					if (obj1.isNodeClicked(d.docId)){
						return "selected";
					}
					else{
						return "unselected"
					}
				})
	.style("cursor","pointer")
	.on("mouseover", function (d,i){
		drawBigHighlightedElement(obj1, valueFunc(d));
	})
	.on("mouseout", function (d,i){
		removeBigHighlightedElement(obj1, valueFunc(d));
	})
	.on("mousedown",function(d,i){
		rowClicked(obj1,valueFunc(d),d3.event);
	
		//Avoid the highlighting due to shift+click
		/*document.getSelection().removeAllRanges();
		
		parentElement = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
		
		if (d3.select(parentElement).attr("id")=="tableTextContext"){
		//Clicked on table 1
			if (d3.event.shiftKey){
				var numberToRetrieve = 10;
				var allow = computeUnselectedNotRemovedPoints();
				moreLikeThisDocument(valueFunc(d)-1,allow,numberToRetrieve);
			}
			else if (d3.event.altKey){
				if (d3.select(this).attr("class")=="selected"){
					d3.select(this).attr("class","unselected");
					selectDocumentInScatterPlot(valueFunc(d)-1);
				}
				else{
					//make Line Highlighted
					d3.select(this).attr("class","selected");
					//select the point
					unselectDocumentInScatterPlot(valueFunc(d)-1);
				}
			}
			else{
				writeFullDocument(valueFunc(d)-1);
			}
		}
		else{
			//Clicked on table 2
			if (d3.event.shiftKey){
				//If line is selected
				if (d3.select(this).attr("class")=="selected"){
					d3.select(this).attr("class","unselected");
					unselectDocumentInScatterPlot(valueFunc(d)-1);
				}
				else{
					//make Line Highlighted
					d3.select(this).attr("class","selected");
					//select the point
					selectDocumentInScatterPlot(valueFunc(d)-1);
				}
			}
			else{
				writeFullDocument(valueFunc(d)-1);
			}
		}*/
	});
	
	rows.exit().remove();

    // Create a cell in each row for each column
	var newCells = d3.select(tableid).select(".tbodyToReplace").selectAll("tr")
	 .selectAll("td")
	//	rows.selectAll("td")
        .data(function (d) {
            return columns.map(function (column) {
                return { column: column, text: textFunc(d), value: valueFunc(d), cluster:clusterFunc(d)};
            });
        })
		.attr("class",function(d){
		return d.column.slice(0,3);})
		.html(function (d) {
			/*if (d.column === columns[1]) return d.text;
			else if (d.column === columns[0]) return d.value;
			else if (d.column === columns[2]) return d.cluster;*/
			if (d.column === columns[0]) return d.value;
			else if (d.column === columns[1]) return d.cluster;
			//else if (d.column === columns[2]) return d.cluster;
		});
		
		newCells.enter()
        .append("td")
		.attr("class",function(d){
		return d.column.slice(0,3);})
		.html(function (d) {
			/*if (d.column === columns[1]) return d.text;
			else if (d.column === columns[0]) return d.value;
			else if (d.column === columns[2]) return d.cluster;*/
			if (d.column === columns[0]) return d.value;
			else if (d.column === columns[1]) return d.cluster;
		});
		newCells.exit().remove();   
}