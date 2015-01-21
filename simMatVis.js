//Some constants
var mostGlobalMax = 0;
var mostGlobalMin = 1;

initialSparsity = 0.9
unDirect = true;
containRowId = 1;//0 if there is no row index; 1 otherwise

var widthTable = 700;
var heightTable = 270;

function drawSimilarityGraph(graphSelection,metricsSelection,wordCloudSelection,similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile,legendSelection,legendText){

	var width = 800,
		height = 500;
		
	var widthGraphMetrics = 800,
		heightGraphMetrics = 80;

	var color = d3.scale.category20();

	var force = d3.layout.force()
		.charge(-500)
		//.linkDistance(300)
		.size([width, height]);

	var svg = graphSelection.append("svg")
		.attr("width", width)
		.attr("height", height);
		
	var svgMetrics = metricsSelection.append("svg")
		.attr("width", widthGraphMetrics)
		.attr("height", heightGraphMetrics);

	var currentWeights = [];
	
	var nodes = [];
	var weights = [];
	
	var weightsPerTopic;
	var wordsPerTopic;
	var selectedNeighbors;
	var currentNeighbors;
	var currentThreshold;
	var nClickedNodes = 0;
	var nodeClicked = [];
	var scaleEdgeThickness;
	
	var thisObject = this;
	
	function drawGraph(similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile){
		var randNumb = Math.floor(Math.random() * 1000);
		d3.text(similarityMatrixFile+ "?" + randNumb, function(datasetText) {
			var similarityMatrix = d3.csv.parseRows(datasetText);
			d3.text(bookTopicFile + "?" + randNumb, function(datasetText) {
				idBookTopic_name = d3.csv.parseRows(datasetText);
				d3.text(topicTypeFile + "?" + randNumb, function(datasetText) {
					topic_type = d3.csv.parseRows(datasetText);
					//Building dictionaryTopic for matching a topic type with a number
					dictionaryTopic ={}
					dictionaryBook ={}
					dictionaryTopic["nTypes"] = 0;
					dictionaryBook["nTypes"] = 0;
					topic_type.forEach(function(row){
						if (dictionaryTopic[row[0]]==undefined){
							dictionaryTopic[row[0]] = dictionaryTopic["nTypes"];
							dictionaryTopic["nTypes"] = dictionaryTopic["nTypes"]+1;
						}
					});
					
					idBookTopic_name.forEach(function(row){
						if (dictionaryBook[row[1]]==undefined){
							dictionaryBook[row[1]] = dictionaryBook["nTypes"];
							dictionaryBook["nTypes"] = dictionaryBook["nTypes"]+1;
						}
					});
					
					d3.text(topicLengthFile + "?" + randNumb, function(datasetText) {
						topic_length = d3.csv.parseRows(datasetText);
						nodes = [];
						weights = [];
						valueArray = [];
						var globalMax = 0;
						var globalMin = 1;
						var rowIndex = 0;
						similarityMatrix.forEach(function(row){
							var colIndex = 0;
							row.forEach(function(value){
								value = parseFloat(value);
								if ((colIndex>0)&&(value !=0)&&(((colIndex-containRowId)>rowIndex)|| !unDirect)){
									//Skip the first column that contains the index
									var contentLink = new Object();
									
									contentLink.source = rowIndex;
									contentLink.target = colIndex-containRowId;

									if (typeof value =="number"){
										contentLink.value = value;
									}
									else{console.log("error!")}
									
									if (value > globalMax) globalMax = value;
									if (value < globalMin) globalMin = value;
									weights.push(contentLink);
									valueArray.push(value);
								}
								colIndex = colIndex + 1;
							});
							nodes.push({"name":"Topic " + parseInt(rowIndex)+" - Book: "+idBookTopic_name[rowIndex][1] + " - Topic: " + idBookTopic_name[rowIndex][2] + " (type: " + topic_type[rowIndex][0] + ")","x":width/2+Math.floor(Math.random() * 100)-50,"y":height/2+Math.floor(Math.random() * 100)-50});
							nodeClicked[rowIndex] = false;
							rowIndex = rowIndex + 1;
						});

						currentWeights = weights.slice(0);
						var scaleDist = d3.scale.linear()
									.domain([1-globalMax,1-globalMin])
									.range([10,250]);
									
						scaleEdgeThickness = d3.scale.linear()
									.domain([globalMin,globalMax])
									.range([0.5,3]);
									
						scaleSize = d3.scale.linear()
									.domain([10,200])
									.range([50,200]);
						force
						.nodes(nodes)
						.links(weights)
						.friction(0.3)
						.linkDistance(function(link, index){
							//console.log(link.value)
							return scaleDist(1-link.value);
						});
						//force.start();

						
						var link = svg.append("g").attr("class","all_links").selectAll(".link")
							.data(weights)
							.enter().append("line")
							.attr("class", "link")
							.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });

						drag = force.drag();
						//.on("dragstart",dragInit)
						//.on("dragend",dragFinish);
						
						var node = svg.append("g").attr("class","all_nodes").selectAll(".node")
							.data(nodes)
							//.enter().append("circle")
							.enter().append("path")
							.attr("class", "node")
							.attr("d", d3.svg.symbol()
										.size(function(d,i){
											return scaleSize(parseInt(topic_length[i][0]));
										})
										.type(function(d,i){
											return d3.svg.symbolTypes[dictionaryBook[idBookTopic_name[i][1]]];
										})
							)
							.attr("transform",function(d){
								return "translate(" + d.x + "," + d.y + ")";
							})
							//.attr("r", function(d,i)
							.style("fill", function(d,i) { 
								return color(dictionaryTopic[topic_type[i][0]]);
							})
							.call(drag)
							.on("mousedown",function(d){
								thisObject.topicClicked(d,d3.event)
							})
							.on("mouseup",topicReleased)
							.on("mouseover",topicHovered)
							.on("mouseout",topicHoveredEnd);


						node.append("title")
							.text(function(d) { return d.name;});

						force.on("tick", function() {
							//node.attr("cx", function(d) { return d.x = d3.max([d3.min([d.x,width-20]),20]); })
							 //.attr("cy", function(d) { return d.y = d3.max([d3.min([d.y,height-20]),20]); })
							 d.x = d3.max([d3.min([d.x,width-20]),20]);
							 d.y = d3.max([d3.min([d.y,height-20]),20]);
							 node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
								
							link.attr("x1", function(d) { return d.source.x; })
								.attr("y1", function(d) { return d.source.y; })
								.attr("x2", function(d) { return d.target.x; })
								.attr("y2", function(d) { return d.target.y; });
							
						});

						force.start();
						//for (var i = 500; i > 0; --i) force.tick();
						//force.stop();
						
						initMetrics();
						// if (mostGlobalMax < globalMax){
							mostGlobalMax = globalMax;
						// }
						// if (mostGlobalMin > globalMin){
							mostGlobalMin = globalMin;
						// }
						// if (allFilesLoaded ==1){
						valueArray.sort()
						var initialThreshold = valueArray[Math.floor(valueArray.length*initialSparsity)];
						listenerLinkThresholdSlider(initialThreshold);
						listenerLinkThresholdValue(initialThreshold);
						
						listenerCheckBoxes();
						
						// }
						// else{
							// allFilesLoaded -=1;
						// }
					});
				});
			});
		});
	}
	this.turnOffColors = function(){
		svg.selectAll(".node")
		.style("fill", function(){return color(0);});
	}
	this.turnOnColors = function(){
		svg.selectAll(".node")
		.style("fill", function(d,i) { 
				return color(dictionaryTopic[topic_type[i][0]]);
		})
	}
	this.turnOffShapes = function(){
		svg.selectAll(".node")
		.attr("d", d3.svg.symbol()
		.size(function(d,i){
			if (d3.select("#chkboxSize")[0][0].checked){
				return scaleSize(parseInt(topic_length[i][0]));
			}
			else{
				return scaleSize.range()[0];
			}
		})
		.type(d3.svg.symbolTypes[0]))
	}
	this.turnOnShapes = function(){
		svg.selectAll(".node")
		.attr("d", d3.svg.symbol()
		.size(function(d,i){
			if (d3.select("#chkboxSize")[0][0].checked){
				return scaleSize(parseInt(topic_length[i][0]));
			}
			else{
				return scaleSize.range()[0];
			}
		})
		.type(function(d,i){
						return d3.svg.symbolTypes[dictionaryBook[idBookTopic_name[i][1]]];
				}));
	}
	
	this.turnOffSize = function(){
		svg.selectAll(".node")
		.attr("d", d3.svg.symbol()
			.type(function(d,i){
				if (d3.select("#chkboxMarker")[0][0].checked){
						return d3.svg.symbolTypes[dictionaryBook[idBookTopic_name[i][1]]];
				}
				else{
						return d3.svg.symbolTypes[0];
				}
			})
			.size(function(d,i){
					return scaleSize.range()[0];
			}));
	}
	this.turnOnSize = function(){
		svg.selectAll(".node")
		.attr("d", d3.svg.symbol()
			.type(function(d,i){
				if (d3.select("#chkboxMarker")[0][0].checked){
						return d3.svg.symbolTypes[dictionaryBook[idBookTopic_name[i][1]]];
				}
				else{
						return d3.svg.symbolTypes[0];
				}
			})
			.size(function(d,i){
					return scaleSize(parseInt(topic_length[i][0]));
			}));
	}
	
	this.filterEdges = function(threshold){
		currentThreshold = threshold;
		currentWeights = [];
console.log("1")
		weights.forEach(function (elem){
			if (parseFloat(elem.value)>=threshold){
				if ((nClickedNodes == 0)||((nodeClicked[elem.source.index] || nodeClicked[elem.target.index]))){
					currentWeights.push(elem);
				}
			}
		});
console.log("2")
		var link = svg.selectAll(".all_links").selectAll(".link").data(currentWeights)
		.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });

		link.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });
		
		link.exit().remove();
		
		var node = svg.selectAll(".node");
console.log("3")
		
		
		force.on("tick", function() {
				//node.attr("cx", function(d) { return d.x = d3.max([d3.min([d.x,width-20]),20]); })
					//.attr("cy", function(d) { return d.y = d3.max([d3.min([d.y,height-20]),20]); })
				node.attr("transform", function(d) {
					d.x = d3.max([d3.min([d.x,width-20]),20]);
					d.y = d3.max([d3.min([d.y,height-20]),20]);
					return "translate(" + d.x + "," + d.y + ")"; });

				link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
			  });
		force.links(currentWeights);
		//.start();
console.log("4")
		force.start();
		for (var i = 1; i > 0; --i) force.tick();
		force.stop();
console.log("5")
		updateMetrics();
console.log("6")
	}


	function topicHovered(d){
		thisObject.highlightNeighbors(d,this);
	}

	function topicHoveredEnd(d){
console.log("topichovEnd")
		thisObject.dehighlightNeighbors(d,this);
	}

	this.topicClicked = function(d,e){
	//function topicClicked(d,e){

		if (e.shiftKey){
			if (nodeClicked[d.index]){
				//unstrokeNode(d.index);
				nClickedNodes = nClickedNodes - 1;
				nodeClicked[d.index] = false;
			}
			else{
				//strokeNode(d.index);
				nClickedNodes = nClickedNodes + 1;
				nodeClicked[d.index] = true;
			}
			thisObject.filterEdges(currentThreshold);
			//dehighlightNeighbors(d,this);
		}
	}
	this.highlightNeighbors = function(d,context){
	//function highlightNeighbors(d,context){
		currentNeighbors = [];
		currentNeighbors = findNeighbors(d);

		d3.select(context)
		.style("stroke","red")
		.style("fill","white");
		
		selectedNeighbors = svg.selectAll(".node").filter(function(d,i){
			if (currentNeighbors.indexOf(d.index)>=0){
				return true;
			}
			else {
				return false;
			}
		})
		.style("stroke","black")
		.style("fill","white");
		
		function findNeighbors(d){
			currentWeights.forEach(function(elem,index,array){
				if ((elem.source.index == d.index)){
					currentNeighbors.push(elem.target.index);
				}
				else if((unDirect && (elem.target.index == d.index))){
					currentNeighbors.push(elem.source.index);
				}
			});
			return(currentNeighbors);
		}
	}

	function topicReleased(d,e){
		
	}
	
	function strokeNode(dd){
		svg.selectAll(".node").filter(function(d,i){
			if (i==dd.index){
				return true;
			}
			else {
				return false;
			}
		})
		.style("stroke","black")
	}
	
	function unstrokeNode(dd){
		svg.selectAll(".node").filter(function(d,i){
			if (i==dd.index){
				return true;
			}
			else {
				return false;
			}
		})
		.style("stroke","white")
	}

	this.dehighlightNeighbors = function (d,context){
	//function dehighlightNeighbors(d,context){
		d3.select(context)
		.style("stroke","white")
		.style("fill",function(d,i){
			if (d3.select("#chkboxColor")[0][0].checked){
				return color(dictionaryTopic[topic_type[d.index][0]]);
			}
			else{
				return color(0);
			}
			}); 
		
		
		selectedNeighbors
		.style("stroke","white")
		.style("fill",function(d,i){
			if (d3.select("#chkboxColor")[0][0].checked){
				return color(dictionaryTopic[topic_type[d.index][0]]);
			}
			else{
				return color(0);
			}
		})
	}

	function updateMetrics(){
		var fullyConnected = nodes.length * (nodes.length -1)/2;
		if (unDirect){
			var currentConnections = currentWeights.length;
		}
		else{
			var currentConnections = currentWeights.length / 2;
		}
		var sparsity = currentConnections/fullyConnected;
		
		svgMetrics.select(".sparsityNumber")
		.text(sparsity.toFixed(3));
	}

	function initMetrics(){
		svgMetrics.append("text").attr("class","sparsityNumber")
		.attr("font-size",50)
		.attr("fill","#0000FF")
		//.attr("stroke","black")
		.attr("text-anchor","end")
		.attr("x",widthGraphMetrics/2)
		.attr("y",heightGraphMetrics/2)
		.text("1.000");
		
		svgMetrics.append("text").attr("class","sparsityText")
		.attr("font-size",20)
		.attr("fill","black")
		//.attr("stroke","black")
		.attr("text-anchor","start")
		.attr("x",widthGraphMetrics/2 + 10)
		.attr("y",heightGraphMetrics/2)
		.text("edge density");
		
	}

	function drawTagClouds(currentTopic,wordList,wordWeights,selectionTagCloud,minGlobalWeight,maxGlobalWeight){
		offsetTitles=10;

		var widthTagCloud = 500;
		var heightTagCloud = 300;

		var maxSizeFont=55;
		var minSizeFont=10;

		var fontSizeScale = d3.scale.sqrt().domain([minGlobalWeight,maxGlobalWeight]).range([minSizeFont,maxSizeFont]);

		////var fill = d3.scale.category20();
		////currentClusterGlobal = currentTopic;//This is for being stored and then being able to restore the tag cloud
		////wordListGlobal = wordList;//This is for being stored and then being able to restore the tag cloud
			if (wordList.length==0){
				//Remove word cloud
				selectionTagCloud.select("svg").remove();
			}
			else{
				//Draw cluster word cloud
				 d3.layout.cloud().size([widthTagCloud, heightTagCloud])
					.words(wordList.map(function(d,i) {
						return {text: d, size: fontSizeScale(wordWeights[i])};
					}))
					.rotate(function() { return 0})//~~(Math.random() * 2) * 90; })
					.font("Impact")
					.fontSize(function(d) { return d.size; })
					.on("end", draw)
					.start();
			}

		  function draw(words) {
			  var bigSelection = selectionTagCloud.append("svg")
					.attr("width", widthTagCloud)
					.attr("height", heightTagCloud + offsetTitles)
					
					bigSelection.append("text")
					.attr("x",20)
					.attr("y",20)
					.style("stroke","black")
					.style("stroke-width","0.4px")
					.style("fill", "black")
					.text(function(d){return "Topic " + (currentTopic+1)});
					
					bigSelection.append("g")
					.attr("transform", "translate(" + (widthTagCloud / 2) + "," + (heightTagCloud / 2 + offsetTitles) +")")
					.selectAll("text")
					.data(words)
					.enter().append("text")
					.style("font-size", function(d) { return d.size + "px"; })
					.style("font-family", "Impact")
					.style("fill", function(d, i) { return "black";/*return fill(i); */})
					.attr("text-anchor", "middle")
					//.style("cursor","pointer")
					.attr("transform", function(d) {
						return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					})
					.text(function(d) { return d.text; });

		  }
	}
	
	//Add top legend
	d3.select(legendSelection).text(legendText);
	
	drawGraph(similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile);
}

function listenerLinkThresholdSlider(initValue){
	//Define a scale
	scaleLinkThreshold = d3.scale.linear()
					.domain([0,100])
					.range([parseFloat(mostGlobalMin),parseFloat(mostGlobalMax)]);
	
	//Set threshold value to initValue in the text area
	d3.select("#linkThresholdValue").attr("value",parseFloat(initValue).toFixed(4));
	//Set threshold value to initValue in the slider
	d3.select("#linkThresholdSlider")[0][0].value = scaleLinkThreshold.invert(initValue);
	
	d3.select("#linkThresholdSlider")
	.on("change", function(){
		//Get value from slider
		linkThresholdSliderValue =this.value;
		
		//Filter edges on all graphs
		allObjects.forEach(function(elem){
				elem.filterEdges(scaleLinkThreshold(parseFloat(linkThresholdSliderValue)));
			});
		
		//Set threshold value in the text area
		d3.select("#linkThresholdValue").attr("value",parseFloat(scaleLinkThreshold(linkThresholdSliderValue)).toFixed(4));
	});
}
function listenerLinkThresholdValue(initialValue){
	d3.select("#linkThresholdValue")
	.on("change", function(){
		var value = parseFloat(this.value);
		if ((value<=1)&&(value>0)){
			d3.select("#linkThresholdSlider")[0][0].value = scaleLinkThreshold.invert(value);
			allObjects.forEach(function(elem){
				elem.filterEdges(parseFloat(value));
			});
		}
	});
	allObjects.forEach(function(elem){
		elem.filterEdges(parseFloat(initialValue));
	});
}

function listenerCheckBoxes(){
	d3.select("#chkboxMarker")
	.on("change", function(){
		if (!this.checked){
			allObjects.forEach(function(elem){
				elem.turnOffShapes();
			});
		}
		else{
			allObjects.forEach(function(elem){
				elem.turnOnShapes();
			});
		}
	});
	
	d3.select("#chkboxSize")
	.on("change", function(){
		if (!this.checked){
			allObjects.forEach(function(elem){
				elem.turnOffSize();
			});
		}
		else{
			allObjects.forEach(function(elem){
				elem.turnOnSize();
			});
		}
	});
	
	d3.select("#chkboxColor")
	.on("change", function(){
		if (!this.checked){
			allObjects.forEach(function(elem){
				elem.turnOffColors();
			});
		}
		else{
			allObjects.forEach(function(elem){
				elem.turnOnColors();
			});
		}
	});

}

function listenerSearchTopic(){
	d3.select("#searchTopic")
		.on("change", function() {
			searchTopicName(this.value);
			//this.value="";
		})
		/*.on("keypress", function() {
			if ((this.value!="")&&(window.event.keyCode==13)){
				window.event.preventDefault();
				enterInsight(this.value);
				this.value="";
			}
		});*/
	function searchTopicName(string){
		//This value should be taken from a checkbox
		
		/*var checkpointRestore = true;
		writeLog(1,"Insight: " + insight);
		d3.select("#annotationAck").text("Insight added")
		if (checkpointRestore){
			saveCurrentStateOnDisk();
		}
		insightIndex = insightIndex + 1;
		var timeout = setTimeout(function() {
			d3.select("#annotationAck").text("")}, 5000);
			*/
		var patt = new RegExp(string,"i")
		//var listMatches = [];
		var listMatchesIndex = [];
		idBookTopic_name.forEach(function(row,index){
			if (patt.test(row[2])){
				//listMatches.push(row[2]);
				listMatchesIndex.push(index);
			}
		});
		//Use table to show these results and when hovered they can be highlighted in the scatterplot, and when clicked should be similar to clicking on the node
		var columns = ["Id", "Book name", "Topic name"];
		data = generateJSONdata(listMatchesIndex,"")
		addDataToTable(data,columns)
	}
}


function addDataToTable(data,columns){
//drawTable(data, tableid, dimensions, textFunc, valueFunc, clusterFunc, columns)
		
	

	var idFunc = function(data) {
		return data.docId;
	}

	var bookFunc = function(data) {
		return data.book;
	}
	
	var topicFunc = function (data) {
		return data.topic;
	}
	
	/*var typeFunc = function (data) {
		return data.type;
	}
	
	var lengthFunc = function (data) {
		return data.length;
	}*/
	 
	
	drawTable(data, "#tableTopicRetrieved", { width: widthTable, height: heightTable }, idFunc, bookFunc , topicFunc, columns);
	
	//d3.select(elementID).select("img").remove();
	//d3.select("#tableProgress").select("img").remove();
	//document.getElementById("progressTagSearch").innerHTML= "";
	
	//document.getElementById("searchKeywords").value = "";
}

function generateJSONdata(indexDocs,query){
dataForTable=[];

//In case we need the query text to appear in red in the table
for (q=0;q<indexDocs.length;q++){
	if (query.length){
		var auxString = changeText(lines[indexDocs[q]], query, 50,'red');
	}
	else{
		var auxString="";
	}
	dataForTable.push({"docId":indexDocs[q],"book": idBookTopic_name[indexDocs[q]][1], "topic": idBookTopic_name[indexDocs[q]][2]});
}
return dataForTable;
}

function drawBigHighlightedElement(obj,index){
	d3.selectAll(".node").each(function(d,i){
		if (i==index){
			obj.highlightNeighbors(d,this);
		}
	});
}

function removeBigHighlightedElement(obj,index){
	d3.selectAll(".node").each(function(d,i){
		if (i==index){
			obj.dehighlightNeighbors(d,this);
		}
	});
}

function rowClicked(obj,index,event){
	d3.selectAll(".node").each(function(d,i){
		if (i==index){
			obj.topicClicked(d,event);
		}
	});
}


var obj1 = new drawSimilarityGraph(d3.select("#svgMethodA"),d3.select("#svgMethodA_metrics"),d3.select("#svgMethodA_wordCloud"),'simMat.csv','topicNames.csv','topicTypes.csv','topicLengths.csv',"#legendFirstColumn","Topic Similarity");

var allObjects = [obj1];

listenerSearchTopic();
