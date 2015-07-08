//Some constants
var mostGlobalMax = 0;
var mostGlobalMin = 1;

initialSparsity = 0.9
unDirect = true;
containRowId = 0;//0 if there is column header; 1 otherwise

var widthTable = 700;
var heightTable = 270;

var topicFileExtension = ".dita";

tutorialMode = false;

String.prototype.trim = function() {
return this.replace(/^\s*|\s*$/g, "")
}
String.prototype.ltrim = function() {
return this.replace(/^\s*/g, "")
}
String.prototype.rtrim = function() {
return this.replace(/\s*$/g, "")
}


function drawSimilarityGraph(graphSelection,metricsSelection,wordCloudSelection,similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile,adjacencyReuseFile,legendSelection,legendText){

	var width = 600,
		height = 500;
		
	var widthGraphMetrics = 600,
		heightGraphMetrics = 5;//80

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
	
	//Contains an object with all the different types of topics as attributes and whether they are selected or not as value
	var allowedConnections = new Object;
	
	var thisObject = this;
	
	this.setCurrentThreshold = function(val){
		currentThreshold = parseFloat(val);
	}
	
	this.getNodes = function(){
		return nodes;
	}
	
	this.getCurrentThreshold = function(){
		return parseFloat(currentThreshold);
	}
	
	this.restartGraph = function(){
		force.start();
	}
	/*this.incrementClickedNodes = function(){
		nClickedNodes++;
	}*/
	
	this.isNodeClicked = function(index){
		if (nodeClicked[index]){
			return true;
		}
		else{
			return false;
		}
	}
	
	this.shiftClickNode = function(index){
		nClickedNodes++;
		nodeClicked[index] = true;
	}
	
	this.getCurrentEdges = function(){
		return currentWeights;
	}
	
	function drawGraph(similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile,adjacencyReuseFile){
		var randNumb = Math.floor(Math.random() * 1000);
		d3.text(similarityMatrixFile+ "?" + randNumb, function(datasetText) {
			var similarityMatrix = d3.csv.parseRows(datasetText);
			d3.text(bookTopicFile + "?" + randNumb, function(datasetText) {
				idBookTopic_name = d3.csv.parseRows(datasetText);
				d3.text(topicTypeFile + "?" + randNumb, function(datasetText) {
					topic_type = d3.csv.parseRows(datasetText);
					d3.json(adjacencyReuseFile+ "?" + randNumb, function(error,datasetText) {
						var adjacencyReuse = eval('('+ datasetText + ')');
					
						//Building dictionaryTopic for matching a topic type with a number
						dictionaryTopic ={}
						dictionaryBook ={}
						dictionaryTopic["nTypes"] = 0;
						listOfUniqueTopics = []
						dictionaryBook["nTypes"] = 0;
						topic_type.forEach(function(row){
							if (dictionaryTopic[row[0]]==undefined){
								dictionaryTopic[row[0]] = dictionaryTopic["nTypes"];
								dictionaryTopic["nTypes"] = dictionaryTopic["nTypes"]+1;
								listOfUniqueTopics.push(row[0]);
								allowedConnections[row[0]]=true;
							}
						});
						
						dictionaryTopicNameNumber ={}
						idBookTopic_name.forEach(function(row){
							if (dictionaryBook[row[1]]==undefined){
								dictionaryBook[row[1]] = dictionaryBook["nTypes"];
								dictionaryBook["nTypes"] = dictionaryBook["nTypes"]+1;
							}
							if (dictionaryTopicNameNumber[row[2].trim()]==undefined){
								dictionaryTopicNameNumber[row[2].trim()] = row[0];
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
										.domain([globalMax,globalMin])
										.range([10,250]);
										
							scaleEdgeThickness = d3.scale.linear()
										.domain([globalMin,globalMax])
										.range([0.5,3]);
										
							scaleSize = d3.scale.linear()
										.domain([200,10000])
										.range([50,200]).clamp(true);
							force
							.nodes(nodes)
							.links(weights)
							.friction(0.3)
							.linkDistance(function(link, index){
								//console.log(link.value)
								return scaleDist(link.value);
							});
							//force.start();

							
							var link = svg.append("g").attr("class","all_links").selectAll(".link")
								.data(weights)
								.enter().append("line")
								.attr("class", "link")
								.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });
							
							// build the arrow.
							svg.append("svg:defs").selectAll("marker")
								.data(["end"])      // Different link/path types can be defined here
							  .enter().append("svg:marker")    // This section adds in the arrows
								.attr("id", String)
								.attr("viewBox", "0 -5 10 10")
								.attr("refX", 15)
								.attr("refY", -1.5)
								.attr("markerWidth", 6)
								.attr("markerHeight", 6)
								.attr("orient", "auto")
							  .append("svg:path")
								.attr("d", "M0,-5L10,0L0,5");
							
							reUseConnections = [];
							//reUseConnections = [{source:1,target: 10, weight: 1}];
							
							d3.keys(adjacencyReuse).forEach(function(sourceElement){
								adjacencyReuse[sourceElement].forEach(function(targetElement){
									var contentLink = new Object();
									contentLink.source = dictionaryTopicNameNumber[sourceElement.split(topicFileExtension)[0]];
									contentLink.target = dictionaryTopicNameNumber[targetElement.split(topicFileExtension)[0]];
									contentLink.value = 1;
									
									reUseConnections.push(contentLink);
								})
							});
							
							
							// add the links and the arrows
							var link2 = svg.append("svg:g").attr("class","all_directed_links").selectAll(".directedLink")
								.data(reUseConnections)
								.enter().append("svg:path")
								//.attr("class", function(d) { return "link " + d.type; })
								.attr("class", "directedLink")
								.style("visibility","hidden")
								.style("stroke",function(d){
									return "red";
								})
								.attr("marker-end", "url(#end)");
							
							drag = force.drag()
							//.on("dragstart",dragInit)
							.on("dragend",dragFinish);
							
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
												return d3.svg.symbolTypes[dictionaryTopic[topic_type[i][0]]];
											})
								)
								.attr("transform",function(d){
									return "translate(" + d.x + "," + d.y + ")";
								})
								//.attr("r", function(d,i)
								.style("fill", function(d,i) { 
									//return color(dictionaryTopic[topic_type[i][0]]);
									//return color(dictionaryBook[idBookTopic_name[i][1]]);
									return color(0);
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
								node.attr("transform", function(d) {
									d.x = d3.max([d3.min([d.x,width-20]),20]);
									d.y = d3.max([d3.min([d.y,height-20]),20]);
									return "translate(" + d.x + "," + d.y + ")"; });
									
								link.attr("x1", function(d) { return d.source.x; })
									.attr("y1", function(d) { return d.source.y; })
									.attr("x2", function(d) { return d.target.x; })
									.attr("y2", function(d) { return d.target.y; });
									
								link2.attr("d", function(d) {
									var dx = nodes[d.target].x - nodes[d.source].x,
										dy = nodes[d.target].y - nodes[d.source].y,
										dr = Math.sqrt(dx * dx + dy * dy);
									
									return "M" + 
										nodes[d.source].x + "," + 
										nodes[d.source].y + "A" + 
										dr + "," + dr + " 0 0,1 " + 
										nodes[d.target].x + "," + 
										nodes[d.target].y;
								});
								
							});

							force.start();
							for (var i = 1; i > 0; --i) force.tick();
							force.stop();
							
							/*
							//This shows a dashboard-type number with the current graph density which perhaps is not very useful
							initMetrics();
							*/
							
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
							//listenerLinkThresholdValue(initialThreshold);
							
							listenerCheckBoxes();
							listenerOverlayCheckBox();
							
							readyWithLoading();
							drawMarkerLegend(listOfUniqueTopics);
							listenerSearchTopic();
							
							//Add book topic to top legend
							d3.select(legendSelection).text(d3.select(legendSelection).text()+ " " + idBookTopic_name[0][1]);
							
							// }
							// else{
								// allFilesLoaded -=1;
							// }
							
							if (tutorialMode == 1){
								alert("Welcome! We will guide you through the main components of this visualization (click ok & follow the steps and please don't disable the dialogs)");
								alert("The table below contains all the topics of this book");
								alert("The network on the left uses different markers to represent the same set of topics. There is a connection for each pair of topics representing their pairwise similarity");
								alert("Hover over a marker to know its corresponding topic and click and drag it to better organize the topics in the screen");
								d3.select("#introHelp").style("visibility","hidden");
								writeHelp("<span style='color:red'>Hover over a marker and click and drag it</span>");
								tutorialMode++;
							}
						});
					});
				});
			});
		});
	}
	
	function dragFinish(){
		if (tutorialMode==2){
			alert("At the beginning we have too many links, so drag the slider (labeled as 'Similarity Threshold') slightly to the right to find topics that are more related between each other");
			writeHelp("<span style='color:red'>Drag the slider (labeled as 'Similarity Threshold') slightly to the right</span>");
			tutorialMode++;
		}
	}
	
	function drawMarkerLegend(listOfTopics){
		//Needs to save unique topic names when reading from disk
		var legendNode = d3.select("#markerLegend").selectAll(".legendNodes")
						.data(listOfTopics);
						
		var groupOfLegend = legendNode.enter()
							.append("g")
							.attr("cursor","pointer")
							.attr("transform",function(d,i){
								return "translate(" + 30 + "," + (i*30 +15) + ")";
							})
							.on("mousedown",function(d,i){
								if (allowedConnections[d]){
									opacityCheckMark(i,0);
									allowedConnections[d]=false;
									if ((tutorialMode==6)&&(!allowedConnections.concept)&&(!allowedConnections.topic)&&(!allowedConnections.reference)&&(allowedConnections.task)){
										alert("Now only links between task topics exist");
										alert("Find Topic 13 (cordap_tk_change-driver-adding) either in the graph or in the table and shift-click on it");
										writeHelp("<span style='color:red'>Shift-click on Topic 13 (in the graph or in the table)</span>");
										tutorialMode++;
									}
								}
								else{
									opacityCheckMark(i,1);
									allowedConnections[d]=true;
								}
								thisObject.filterEdges(currentThreshold);
							});
					
		groupOfLegend.append("path")
				.attr("class", "legendNode")
				.attr("d", d3.svg.symbol()
							.size("50")
							.type(function(d,i){
								return d3.svg.symbolTypes[i];
							})
				)				
				//.attr("r", function(d,i)
				.style("fill", function(d,i) { 
					//return color(dictionaryTopic[topic_type[i][0]]);
					//return color(dictionaryBook[idBookTopic_name[i][1]]);
					return color(0);
				});
				
		
		groupOfLegend.append("text")
		.attr("dx","10px")
		.attr("dy","5px")
		.text(function(d){return d;});
		
		/*
		groupOfLegend.append("image")
		.attr("src","./checkbox.svg")
		.attr("dx","40px");
		*/
		/*groupOfLegend[0].forEach(function(value,index){
			d3.xml("./checkbox.svg", "image/svg+xml", function(xml) {
				groupOfLegend[0][index].appendChild(xml.documentElement);
			});
		});*/
		
		var groupOfLegend2 = legendNode.enter()
							.append("g")
							.attr("class","checkBoxGroup")
							.attr("cursor","pointer")
							.attr("transform",function(d,i){
								return "translate(" + 0 + "," + (i*30 +5) + "),scale(0.5)";
							})
							.on("mousedown",function(d,i){
								if (allowedConnections[d]){
									opacityCheckMark(i,0);
									allowedConnections[d]=false;
									if ((tutorialMode==6)&&(!allowedConnections.concept)&&(!allowedConnections.topic)&&(!allowedConnections.reference)&&(allowedConnections.task)){
										alert("Find Topic 13 (cordap_tk_change-driver-adding) either in the graph or in the table and shift-click on it");
										writeHelp("<span style='color:red'>Shift-click on Topic 13 (in the graph or in the table)</span>");
										tutorialMode++;
									}
								}
								else{
									opacityCheckMark(i,1);
									allowedConnections[d]=true;
								}
								thisObject.filterEdges(currentThreshold);
							});		
		
		groupOfLegend2.append("rect")
				.attr("class", "emptyCheckMark")
				.attr("x","0")
				.attr("y","5")
				.attr("width","25")
				.attr("height","25")
				.attr("rx","5")
				.attr("ry","5")
				.style("fill","white")
				.style("stroke", function(d,i) { 
					//return color(dictionaryTopic[topic_type[i][0]]);
					//return color(dictionaryBook[idBookTopic_name[i][1]]);
					return "black";
				});

		
		groupOfLegend2.append("path")
				.attr("class", "checkMark")
				.attr("d", "M30.171,6.131l-0.858-0.858c-0.944-0.945-2.489-0.945-3.433,0L11.294,19.859l-5.175-5.174  c-0.943-0.944-2.489-0.944-3.432,0.001l-0.858,0.857c-0.943,0.944-0.943,2.489,0,3.433l7.744,7.75c0.944,0.945,2.489,0.945,3.433,0  L30.171,9.564C31.112,8.62,31.112,7.075,30.171,6.131z")
				//.attr("r", function(d,i)
				.style("fill", function(d,i) { 
					//return color(dictionaryTopic[topic_type[i][0]]);
					//return color(dictionaryBook[idBookTopic_name[i][1]]);
					return "black";
				});
				
	}
	
	function opacityCheckMark(index,opacity){
		d3.select("#markerLegend")
			.selectAll(".checkMark")
			.filter(function(d,i){
				if (i==index){
					return true;
				}
				else{
					return false;
				}
			})
			.style("opacity",opacity);
	}
	this.turnOffColors = function(){
		svg.selectAll(".node")
		.style("fill", function(){return color(0);});
	}
	this.turnOnColors = function(){
		svg.selectAll(".node")
		.style("fill", function(d,i) { 
				//return color(dictionaryTopic[topic_type[i][0]]);
				return color(dictionaryBook[idBookTopic_name[i][1]]);
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
					//return d3.svg.symbolTypes[dictionaryBook[idBookTopic_name[i][1]]];
					return d3.svg.symbolTypes[dictionaryTopic[topic_type[i][0]]];
			}));
	}
	
	this.turnOffSize = function(){
		svg.selectAll(".node")
		.attr("d", d3.svg.symbol()
			.type(function(d,i){
				if (d3.select("#chkboxMarker")[0][0].checked){
						return d3.svg.symbolTypes[dictionaryTopic[topic_type[i][0]]];
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
						return d3.svg.symbolTypes[dictionaryTopic[topic_type[i][0]]];
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
		//currentThreshold = threshold;
		currentWeights = [];

		weights.forEach(function (elem){
			if (parseFloat(elem.value)>=threshold){
				//Check that if there is any shift-clicked nodes, to be connecting one of these
				if ((nClickedNodes == 0)||((nodeClicked[elem.source.index] || nodeClicked[elem.target.index]))){
					if ((allowedConnections[topic_type[elem.source.index]])&&(allowedConnections[topic_type[elem.target.index]])){
						currentWeights.push(elem);
					}
				}
			}
		});

		var link = svg.selectAll(".all_links").selectAll(".link").data(currentWeights)
		.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });

		link.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });
		
		link.exit().remove();
		
		var node = svg.selectAll(".node");
		
		// add the links and the arrows
		var link2 = svg.selectAll(".all_directed_links").selectAll(".directedLink")
			.data(reUseConnections);

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
					
				link2.attr("d", function(d) {
					var dx = nodes[d.target].x - nodes[d.source].x,
						dy = nodes[d.target].y - nodes[d.source].y,
						dr = Math.sqrt(dx * dx + dy * dy);
					
					return "M" + 
						nodes[d.source].x + "," + 
						nodes[d.source].y + "A" + 
						dr + "," + dr + " 0 0,1 " + 
						nodes[d.target].x + "," + 
						nodes[d.target].y;
				});
			  });

		force.links(currentWeights);
		//.start();

		force.start();
		for (var i = 1; i > 0; --i) force.tick();
		force.stop();
		
		/*
		//This shows a dashboard-type number with the current graph density which perhaps is not very useful
		updateMetrics();
		*/
		
	}


	function topicHovered(d){
		thisObject.highlightNeighbors(d,this);
	}

	function topicHoveredEnd(d){
		thisObject.dehighlightNeighbors(d,this);
	}

	this.topicClicked = function(d,e){
	//function topicClicked(d,e){

		if (e.shiftKey){
			if (nodeClicked[d.index]){
				//unstrokeNode(d.index);
				nClickedNodes = nClickedNodes - 1;
				nodeClicked[d.index] = false;
				unhighlightTableRow(d.index);
			}
			else{
				//strokeNode(d.index);
				nClickedNodes = nClickedNodes + 1;
				nodeClicked[d.index] = true;
				highlightTableRow(d.index);
			}
			thisObject.filterEdges(currentThreshold);
			//dehighlightNeighbors(d,this);
		}
		if ((tutorialMode==7)&&(nodeClicked[13])){
			alert("Shift-clicking allows focusing on topic 13 and its similarity to other topics");
			alert("Finally, if you want to check how topic 13 differs with regard to other task topics or whether any content here could be reused from an existing topic, you need to visualize the text. Click the grey button 'Compare' on the right. Feel free to adjust the similarity threshold and the 'allowed-type connections' checkboxes.")
			writeHelp("<span style='color:red'>Adjust threshold and checkboxes as needed. Then press the 'Compare' button</span>");
			tutorialMode++;
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
	
	this.collectCenterAndNeighbors = function(maxNeighbors){
		output = {center: -99, listOfNeighbors: [], error: false};
		var allNodes = [];
		var allValues = [];
		currentWeights.forEach(function(elem){
			
			if (allNodes.indexOf(elem.source.index)==-1){
				allNodes.push(elem.source.index);
			}
			else{
				if ((output.center == -99) || (output.center == elem.source.index)){
					output.center = elem.source.index;
				}
				else{
					output.error = true;
				}
			}
			if (allNodes.indexOf(elem.target.index)==-1){
				allNodes.push(elem.target.index);
			}
			else{
				if ((output.center == -99) || (output.center == elem.target.index)){
					output.center = elem.target.index;
				}
				else{
					output.error = true;
				}
			}
			allValues.push(elem.value);
		});
		if ((!output.error)&&(output.center== -99)){
			if (nodeClicked[allNodes[0]]){
				output.center = allNodes[0];
			}
			else{
				output.center = allNodes[1];
			}
		}
		var indexCenter = allNodes.indexOf(output.center);
		allNodes.splice(indexCenter,1)
		
		indices = d3.range(allNodes.length);
		indices.sort(function (a, b) { return allValues[a] < allValues[b] ? 1 : allValues[a] > allValues[b] ? -1 : 0; });
		
		for (var q=0;q<d3.min([maxNeighbors,allNodes.length]);q++){
			output.listOfNeighbors.push(allNodes.slice(indices[q], indices[q] + 1));
		}
		return output;
	}
	
	//Add top legend
	d3.select(legendSelection).text(legendText);
	
	drawGraph(similarityMatrixFile,bookTopicFile,topicTypeFile,topicLengthFile,adjacencyReuseFile);
}

function listenerLinkThresholdSlider(initValue){
	//Define a scale
	scaleLinkThreshold = d3.scale.linear()
					.domain([0,100])
					.range([parseFloat(mostGlobalMin),parseFloat(mostGlobalMax)]);
	
	//Set threshold value to initValue in the text area
	//d3.select("#linkThresholdValue")[0][0].value = parseFloat(initValue).toFixed(4);
	
	//Set threshold value to initValue in the slider
	d3.select("#linkThresholdSlider")[0][0].value = scaleLinkThreshold.invert(initValue);
	
	allObjects.forEach(function(elem){
				elem.setCurrentThreshold(parseFloat(initValue).toFixed(4));
			});
	
	d3.select("#linkThresholdSlider")
	.on("change", function(){
		//Get value from slider
		linkThresholdSliderValue =this.value;
		
		//Filter edges on all graphs
		allObjects.forEach(function(elem){
				elem.setCurrentThreshold(scaleLinkThreshold(parseFloat(linkThresholdSliderValue)));
				elem.filterEdges(scaleLinkThreshold(parseFloat(linkThresholdSliderValue)));
			});
		
		//Set threshold value in the text area
		//d3.select("#linkThresholdValue")[0][0].value = parseFloat(scaleLinkThreshold(linkThresholdSliderValue)).toFixed(4);
		
		if (tutorialMode==3){
			alert("We can also overlay existing conref reuses to know what it has been already reused. Check the box in the lower left corner ('Overlay conref reuse')");
			writeHelp("<span style='color:red'>Click the overlay conref reuse checkbox</span>");
			tutorialMode++;
		}
		if (tutorialMode==5){
			alert("Now, assume you have to modify Topic 13 (a task type of topic), but you would like to check first how this topic relates to others")
			alert("Let's assume you are only interested in task topics. Therefore, uncheck everything but 'Task' in the checkboxes under 'Allowed type connections'");
			writeHelp("<span style='color:red'>Uncheck all topic-types under 'Allowed type connections' but 'Task'</span>");
			tutorialMode++;
		}
	});
}
function listenerLinkThresholdValue(initialValue,globalMin,globalMax){
	
	d3.select("#linkThresholdValue")
	.attr("min", mostGlobalMin)
	.attr("max", mostGlobalMax)
	.on("change", function(){
		var value = parseFloat(this.value);
		//if ((value<=1)&&(value>0)){
		if (true){
			d3.select("#linkThresholdSlider")[0][0].value = scaleLinkThreshold.invert(value);
			allObjects.forEach(function(elem){
				elem.setCurrentThreshold(value);
				elem.filterEdges(parseFloat(value));
			});
		}
	});
	/*
	allObjects.forEach(function(elem){
		elem.filterEdges(parseFloat(initialValue));
	});
	*/
}

function listenerOverlayCheckBox(){
	d3.select("#chkboxOverlay")
	.on("change", function(){
		overlayReuse(this.checked);
		if (tutorialMode==4){
			alert("Not surprisingly, some of the existing conref reuse links (in red) coincide with the similarity links");
			alert("Move the similarity threshold back to the left");
			writeHelp("<span style='color:red'>Move similarity threshold to the left</span>");
			
			tutorialMode++;
		}
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
		searchTopicName("")
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
		//var columns = ["Id", "Book name", "Topic name"];
		var columns = ["Id", "Topic name"];
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

function callTextComparison(){
	//get main and neighbor nodes
	centerNeighbors = obj1.collectCenterAndNeighbors(5);
	if (centerNeighbors.error){
		alert("To run the comparison, there must be only a single topic connected to one or more topics (use <shift> + click on a node to look at the neighbors of a topic)")
	}
	else{
		var stringOfNeighbors = "(";
		centerNeighbors.listOfNeighbors.forEach(function(elem,index,array){
			if ((index+1)==array.length){
				stringOfNeighbors = stringOfNeighbors + elem;
			}
			else{
				stringOfNeighbors = stringOfNeighbors + elem + ",";
			}
		})
		stringOfNeighbors= stringOfNeighbors + ")";
		
		var book, similarity;
		var patternToFind = /book=(\w+)/;
		if (patternToFind.test(window.location.href)){
			book = patternToFind.exec(window.location.href)[1];
		}
		else{
			book = 'None'
		}
		var patternToFind = /similarity=(\w+)/;
		if (patternToFind.test(window.location.href)){
			similarity = patternToFind.exec(window.location.href)[1];
		}
		else{
			alert('Similarity not known')
		}
		
		if (tutorialMode==8){
			alert("Well done! This is the end of this tutorial. You can restart it by reloading the page. The question mark icons provide further information on different components. You can close this page and the new page with the text comparison that will open on a new tab (we will come back to this new visualization later) and go back to the survey.")
			writeHelp("");
			d3.select("#introHelp").style("visibility","visible");
		}
		
		var win = window.open('../DITA-one-on-many-comparison/multiple.html?book='+ book + ',topic=' + centerNeighbors.center + ",neighbors=" + stringOfNeighbors + ',similarity=' + similarity, '_blank');
		win.focus();
	}
}

function removeBigHighlightedElement(obj,index){
	d3.selectAll(".node").each(function(d,i){
		if (i==index){
			obj.dehighlightNeighbors(d,this);
		}
	});
}

function highlightTableRow(index){
	d3.select(".tbodyToReplace").selectAll("tr").filter(function(d){if (d.docId==index) return true;}).attr("class","selected");
}

function unhighlightTableRow(index){
	d3.select(".tbodyToReplace").selectAll("tr").filter(function(d){if (d.docId==index) return true;}).attr("class","unselected");
}

function rowClicked(obj,index,event){
	d3.selectAll(".node").each(function(d,i){
		if (i==index){
			obj.topicClicked(d,event);
		}
	});
}

function startingFromATopic(obj,topicIndex){
	//Used to artificially applied a shift-click at the beginning which connects the graph using only one node
	obj.shiftClickNode(topicIndex);
	obj.filterEdges(obj.getCurrentThreshold());
	obj.restartGraph();
}

function readyWithLoading(){
	var patternToFind = /topic=\d+/;
	if (patternToFind.test(window.location.href)){
		var topicIndex = parseInt(patternToFind.exec(window.location.href)[0].split("=")[1]);
		if (topicIndex==-1){
			obj1.filterEdges(obj1.getCurrentThreshold());
		}
		else{
			startingFromATopic(obj1,topicIndex);
		}
	}
	else{
		obj1.filterEdges(obj1.getCurrentThreshold());
	}
	
}

function readInput(){
	var patternToFind = /book=(\w+)/;
	
	var similarity;
	var patternToFind2 = /similarity=(\w+)/;
	if (patternToFind2.test(window.location.href)){
		similarity = patternToFind2.exec(window.location.href)[1];
	}
	else{
		similarity = 'None'
	}
	
	var patternToFind3 = /tutorial/;
	if (patternToFind3.test(window.location.href)){
		tutorialMode = 1;
	}
	
	if (patternToFind.test(window.location.href)){
		var subDir = './Data/';
		if (patternToFind.exec(window.location.href)[1]=='VSP4000'){
			
		}
		else if (patternToFind.exec(window.location.href)[1]=='VSP8200'){
			
		}
		else if (patternToFind.exec(window.location.href)[1]=='CORDAPContentDeveloper'){
			subDir = subDir + 'CORDAPContentDeveloper/'
			
		}
		else if (patternToFind.exec(window.location.href)[1]=='CORDAPProductOwner'){
			subDir = subDir + 'CORDAPProductOwner/'
		}
		else if (patternToFind.exec(window.location.href)[1]=='CORDAPReviewer'){
			subDir = subDir + 'CORDAPReviewer/'
		}
		else if (patternToFind.exec(window.location.href)[1]=='CORDAPSystemAdmin'){
			subDir = subDir + 'CORDAPSystemAdmin/'
		}
		else if (patternToFind.exec(window.location.href)[1]=='Movious'){
			
		}
		else if (patternToFind.exec(window.location.href)[1]=='NonClientSpecific'){
			
		}
		else{
			alert('Wrong input');
		}
		obj1 = new drawSimilarityGraph(d3.select("#svgMethodA"),d3.select("#svgMethodA_metrics"),d3.select("#svgMethodA_wordCloud"), subDir + 'simMatrix_' + similarity + '_thres4_aggregmax_normFunzScore_normRefmatrix',subDir + 'idBookTopic', subDir + 'topicLabels', subDir + 'topicLengths', subDir + "nameconrefId", "#legendFirstColumn", "Topic Similarity");
	}
	else{
		alert('Wrong input');
	}
}



function overlayReuse(makeVisible){
	if (makeVisible){
		d3.selectAll(".directedLink").style("visibility","visible");
	}
	else{
		d3.selectAll(".directedLink").style("visibility","hidden");
	}
}

function graphHelp(){
	var content = "<ul><li>Each marker represents a topic. </li><li>The proximity and thickness of edges represent the pairwise similarity between topics. </li><li>Shift-click on a topic to focus on its most similar topics. Shift-click again for undoing the focusing.</li><li>The overlay conref reuse checkbox allows identifying existing conref reuse cases.</li></ul>";
	var title = "Topic Similarity Graph";
	writeNewDialog(title,content,[]);
	}
function thresholdHelp(){
	var content = "<ul><li>Adjust the threshold to reduce or increase the number of similarity relationships to be shown. </li><li>The middle position of the slider represents the average similarity value.</li></ul>";
	var title = "Similarity Threshold";
	writeNewDialog(title,content,[]);
}
function checkboxHelp(){
	var content = 'Size checkbox: <ul><li>Turns on/off whether the marker size in the graph is proportional to topic length or not.</li></ul>Marker checkbox: <ul><li>Turns on/off whether the marker shape in the graph is associated to the topic type or not.</li></ul>Compare button: <ul><li>Click "Compare" to visualize the text of a topic with those of their closest neighbors (there must be only a single topic connected to one or more topics).</li></ul>';
	var title = "Markers / Compare";
	writeNewDialog(title,content,[]);
}
function topicTypeHelp(){
	var content = "<ul><li>Forces connections in the graph to be between checked topic types only.</li></ul>";
	var title = "Topic Type Connections";
	writeNewDialog(title,content,[]);
}
function topicSearchHelp(){
	var content = "<ul><li>Enter a query and press &lt;Tab&gt; to retrieve topics containing the entered string. </li><li>Hover the mouse over the table to identify the topic in the graph.</li></ul>";
	var title = "Topic Search";
	writeNewDialog(title,content,[]);
}
function writeHelp(text){
	d3.select("#help").html(text);
}

function writeNewDialog(dialogTitle,text,list){
	d3.select("#dialog").select("p").html(text);
	$("#dialog").dialog({
		width: 400,
		title: dialogTitle,
		close: function(e,ui){
			if (list.length>0){
				writeNewDialog(list[0].title,list[0].text,list.slice(1));
			}
			
		}
	});
}

//var obj1 = new drawSimilarityGraph(d3.select("#svgMethodA"),d3.select("#svgMethodA_metrics"),d3.select("#svgMethodA_wordCloud"),'simMat.csv','topicNames.csv','topicTypes.csv','topicLengths.csv',"#legendFirstColumn","Topic Similarity");

readInput();
var allObjects = [obj1];




