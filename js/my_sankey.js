var inputData = [];
var graph = {nodes:[], links:[]};
var groupMap = {};
var groupList = [];
var history = [];
var halfPieHeight = 100;
var textLength = 42;
var maxUnlinkedLinks = 40;
var lastEnteredNode;
var emailAddress = 'smartercitizens@unibg.it';

/* input */
var source = {name: "", group: "MACROAREA"};
var target = null;

$(document).ready(function() {
  if(window.location.hash == "" || window.location.hash == "#/") {
    getData(source, target);
  }
});
/* ***** */

/* Routing */
var viewProject = function(title) {
  history = [];
  getData(source, target, showProjectDetail, title);
}

var routes = {
  '/title/:title': viewProject
};

var router = Router(routes);
router.init();
/***/

var margin = { top: 10, right: 0, bottom: 10, left: 0 },
    width = $(window).width() - margin.left - margin.right,
    height = $(window).height() - margin.top - margin.bottom - 200;
 
var formatNumber = d3.format(",.0f"), // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scale.category10();

// append the svg canvas to the page
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + halfPieHeight)
  .append("g")
    .attr("transform", "translate(" + (margin.left + 320) + "," + margin.top + ")");
 
// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(10)
    .size([width, height]);
 
var path = sankey.link();

var nodeenter = "mouseenter";
var nodeleave = "mouseleave";

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  nodeenter = "touchstart"; 
  nodeleave = "touchcancel"; 
}

var click = "click";

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  click = "touchstart"; 
}

function getData(source, target, cb, cbtitle) {
  if (!_.isEqual(_.last(history), {source: source, target: target})) {
    history.push({source: source, target: target});
    updateBreadcrumb(history);
  }

  //init
  graph = {nodes:[], links:[]};
  groupMap = {};

  d3.json("data/knowledgeMapLists.json", function(error, data) {
    inputData = data;
    var i = 0;

    groupMap[source.group] = {key: source.group, level: 1, movex: 0};
    groupMap[target] = {key: target, level: 2, movex: -410};

    //groupList = _.keys(data[0]);
    groupList = [
      "TITOLO",
      "MACROAREA",
      "PROMOTORE PROGETTO",
      "COMMITTENTE/FINANZIATORE",
      //"BUDGET",
      "PARTNERS"
    ];

    //split lists
    _.each(data, function(d) {
      _.each(_.union(groupList, "TAGS", "WEBSITES"), function(group) { //TODO plus tags
        //d[group.label] = d[group.label].split(',');
	d[group] = $.map(d[group].split(","), $.trim);
      });
    });

    _.each(groupList, function(d, i) {
      groupList[i] = {
        label: d,
	value: groupList.length
      }
    });

    //source nodes
    var sourcenodes = [];
    _.each(_.pluck(data, source.group), function(d) {
      sourcenodes = _.union(sourcenodes, d);
    });

    _.each(sourcenodes, function(d) {
      graph.nodes.push({
        name: d,
	group: source.group,
	id: i++
      });
    });

    var rootNodes = graph.nodes.slice(0);

    _.each(data, function(d) {
      if (d[source.group] == source.name || _.contains(d[source.group], source.name)) {
	//if(typeof d[target] != "object") d[target] = [d[target]];

	_.each(d[target], function(dt) {
	  //if (typeof d[source.group] != "object") d[source.group] = [d[source.group]];
	  var sourceId;
	  _.each(rootNodes, function(dr) {
	    if (dr.name == source.name && _.contains(d[source.group], dr.name)) {
	      sourceId = dr.id;
	    }
	  });

  	  //update link
          var node = _.where(graph.nodes, {name: dt, group: target});
          if (node.length != 0) {
            var link = _.where(graph.links, {source: sourceId, target: node[0].id});
	    if (link.length != 0) {
              link[0].value++;
              return;
	    } else { //crea nuovo link a node e ritorna
	      graph.links.push({
	        source: sourceId,
		target: node[0].id,
		value: 1
	      });
	      return;
	    }
          }
  
          //target nodes
          graph.nodes.push({
            name: dt,
            group: target,
  	    id: i
          });

          //links
	  graph.links.push({
            /*source: rootNode,
            target: {name: d[target], group: target},*/
            source: sourceId,
            target: i,
            value: 1 
          });
	  i++;
        });
      }

    });

    var extraLinks = [];
    _.each(data, function(d) {
	//if (typeof d[source.group] != "object") d[source.group] = [d[source.group]];
	_.each(d[target], function(dt) {
	  if (_.where(graph.nodes, {name: dt, group: target}).length == 0) return; //node esists
	  var link = {
	    source: _.where(rootNodes, {name: d[source.group][0]})[0].id,
	    target: _.where(graph.nodes, {name: dt, group: target})[0].id,
	    value: 1
	  };
	  if (_.where(graph.links, {source: link.source, target: link.target}).length == 0) {
	    if (_.where(extraLinks, {source: link.source, target: link.target}).length != 0) { //update se esiste in extra
	      _.where(extraLinks, {source: link.source, target: link.target})[0].value++;
	    } else {
	      extraLinks.push(link);
	    }
	  }
	});
    });

    graph.links = _.union(graph.links, extraLinks);

    //if (root.id not in link.source)
    var sourcelinks = _.uniq(_.pluck(graph.links, 'source'));
    graph.nodes.push({
      name: "hidden",
      group: target,
      id: graph.nodes.length
    });
    _.each(rootNodes, function(d) {
      var id = d.id;
      if(!(_.contains(sourcelinks, id))) {
        //d.unlinked = "unlinked";

	graph.links.push({
	  source: d.id,
	  target: graph.nodes.length - 1,
	  value: 1,
	  name: "hidden"
	});
      }
    });

    //remove nodes without links if > n
    var hiddenlinks = _.where(graph.links, { name: "hidden" });
    var hiddennodes = 0;
    if (hiddenlinks.length > maxUnlinkedLinks) {

      _.each(_.last(hiddenlinks, hiddenlinks.length - maxUnlinkedLinks), function(link) {
        //related node
	var node = _.where(graph.nodes, { id: link.source })[0];
	//node.unlinked = "unlinked";
	graph.nodes = _.without(graph.nodes, node);
	graph.links = _.without(graph.links, link);

	hiddennodes++;
      });
    }
    
    var visiblesourcelength = sourcenodes.length - hiddennodes;
    var newheight = visiblesourcelength * 25 < height ? height : visiblesourcelength * 25;

    var rightlength = graph.nodes.length - visiblesourcelength;
    newheight = newheight < rightlength * 25 ?  rightlength * 25 : newheight;
  
    sankey.size([width - 660, newheight]);
    $("svg").height(newheight + halfPieHeight);
    
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);
	    
    plotGraph(source);
    //callback if hash title
    if (cb) cb(cbtitle);
  })
}

function plotGraph(source) {
  svg.selectAll(".link").remove(); //TODO selective remove
  svg.selectAll(".node").remove();
 
  var link = svg.selectAll(".link")
      .data(graph.links);

  link.enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .attr("rx", 12)
      .attr("name", function(d) { return d.name })
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .attr("stroke-dasharray", 20000 + " " + 20000) //TODO length
      .attr("stroke-dashoffset", 2000) //TODO
      .transition()
      .duration(0)
        .attr("stroke-dashoffset", 0)
        .sort(function(a, b) { return b.dy - a.dy; });

  link.exit().remove();

  // add in the nodes
  var node = svg.selectAll(".node")
      .data(graph.nodes);

  var nodeg = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + 0 + "," + d.y + ")" })
      .attr("group", function(d) { return d.group })
      .attr("name", function(d) { return d.name })
      .on(nodeenter, function(d) {
        d3.event.preventDefault();
	d3.event.stopPropagation();

	if (lastEnteredNode && lastEnteredNode != this) onNodeLeave(lastEnteredNode, source);
	lastEnteredNode = this;

        d3.select(this).select(".detail-icon").classed("show", true);
        d3.select(this).select(".back-icon").classed("show", true);

        if (d3.select(this).select(".detail-icon")[0][0] && d3.select(this).select(".back-icon")[0][0]) {
	  var bis = true;
	} else {
	  var bis = false;
	}
	
	d3.select(this).select("rect").style("fill", color(d3.select(this).attr("name")));
	d3.select(this).select(".node-title").transition().duration(300).attr("x", -10).attr("text-anchor", "end");

	if (source.group == d3.select(this).attr("group")) {
          d3.select(this).select(".node-title").text(sizedText(d3.select(this).attr("name"), textLength));
	} else {
	  d3.select(this).select(".node-title").text(sizedText(d3.select(this).attr("name"), textLength + 10));
	}
	
        halfPie(this, groupList);
	if (d3.select(this).select("rect").attr("height") < 100) {
	  var diff = 100 - d3.select(this).select("rect").attr("height");
	  d3.select(this).select(".node-title").transition().duration(300).attr("y", 50).attr("x", -10).attr("text-anchor", "end");

	  if (bis) {
	    d3.select(this).select(".detail-icon").transition().duration(300).attr("y", 55 + 15);
	    d3.select(this).select(".back-icon").transition().duration(300).attr("y", 55 - 10);
	  } else {
	    d3.select(this).select(".detail-icon").transition().duration(300).attr("y", 55);
	    d3.select(this).select(".back-icon").transition().duration(300).attr("y", 55);
	  }

	  zoomInNode(this, diff);
	}
      })
      .on(nodeleave, function() {
        onNodeLeave(this, source);
      });

  nodeg//.transition()
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
      .attr("initialTransform", function(d) { return "translate(" + d.x + "," + d.y + ")" });
      
  // add the rectangles for the nodes
  nodeg.append("rect")
         .attr("height", function(d) { return d.dy; })
         .attr("initialHeight", function(d) { return d.dy; })
         .attr("width", sankey.nodeWidth())
         .style("fill", function(d) {
	   if (source.name && d.group == source.group && d.name != source.name) return "#CCCCCC";
	   return d.color = color(d.name);
	 })
         .style("stroke", function(d) { return d3.rgb(d.color).darker(2) })
	 .style("stroke-width", 0)
	 .style("opacity", 0)
         .transition().duration(200)
           //.delay(function(d, i) { return i * 300 })
           .style("opacity", 1);    
  
  node.exit().remove();

  /*nodeg.append("title")
      .text(function(d) { return d.name + "\n" + format(d.value); });*/

  // add in the title for the nodes
  nodeg.append("text")
      .attr("class", "node-title")
      .attr("x", 42)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .text(function(d) {
        if (d.group == source.group) return sizedText(d.name, textLength + 10)
	else return sizedText(d.name, textLength)
      })
      .attr("opacity", 0)
      .transition().duration(500)
        .attr("opacity", 1);

  // add back icon
  var backNode = node
      .filter(function(d) {
        return d.group == _.last(history).source.group && d.name == _.last(history).source.name;
      })
      .append("text")
      .attr("class", "back-icon")
      .attr("x", 9)
      .attr("y", function(d) {
        if (d.group == "TITOLO") return (d.dy / 2) - 5;
	else return (d.dy / 2) + 9;
      })
      .text(function() { return "\uf060" })
      .on("click", function() {
        back();
      });

  //add detail icon
  var titleNode = node
      .filter(function(d) { //TODO uppercase/lowercase?
        return d.group == "TITOLO";
      })
      .append("text")
      .attr("class", "detail-icon")
      .attr("x", 13)
      .attr("y", function(d) {
        if (d.group == _.last(history).source.group && d.name == _.last(history).source.name) return (d.dy / 2) + 25;
        else return (d.dy / 2) + 9;
      })
      .attr("name", function(d) {
        return d.name;
      })
      .text(function() { return "\uf129" })
      .on(click, function() {
	showProjectDetail($(this).attr("name"));
      });

  window.addEventListener('touchstart', function() {
    if (lastEnteredNode) onNodeLeave(lastEnteredNode, source);
  }, false);
};

function showProjectDetail(projectName) {
  /*d3.event.preventDefault();
  d3.event.stopPropagation();*/

  $('#info .modal-info').empty();
  _.each(inputData, function(d) {
    //if (_.contains(d["TITOLO"], projectName)) {
    if (urlFormat(d["TITOLO"][0]) == urlFormat(projectName)) {
      $('#info .modal-title').text(d["TITOLO"]);
      $('#info #startdate .date').text(d["DATA INIZIO"]);
      $('#info #enddate .date').text(d["DATA FINE"]);

      $('#info .mailto').attr('href', 'mailto:' + emailAddress + '?subject=' + projectName + ' - richiesta info');

      var link = window.location.origin + window.location.pathname + '#/title/' + urlFormat(projectName);
      
      $('#info .fb-share').attr('link', link);
      $('#info .twitter-share').attr('link', link);

      $('#info .modal-info').append(d["ABSTRACT"]);
      $('#info .modal-info').append($('<br>'));
      $('#info .modal-info').append($('<br>'));

      //websites
      _.each(d["WEBSITES"], function(website) {
        var http = website.substring(0, 7) == "http://" ? "" : "http://";
        var a = $('<a></a>').attr('href', http + website).text(website);
         $('#info .modal-info').append(a);
         $('#info .modal-info').append($('<br>'));
         $('#info .modal-info').append($('<br>'));
      });

      var p = $("<p></p>");
      _.each(d["TAGS"], function(tag) {
        var label = $('<span></span>').addClass('label label-default').text(tag);
	p.append(label);
	p.append('&nbsp;');
      });
      $('#info .modal-info').append(p);

      $('#info').modal();
      return;
    }
  })
}

$('#info').on('hidden.bs.modal', function (e) {
  document.location.hash = '/';
})

function fbshareLink(elm) {
  var link = $(elm).attr('link');
  var leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
  var topPosition = (window.screen.height / 2) - ((300 / 2) + 50);
  
  window.open("https://www.facebook.com/sharer/sharer.php?u="+ escape(link) + "&t=" + document.title,
               'facebook', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,left='+leftPosition+',top='+topPosition);
  return false;
}

function twittershareLink(elm) {
  var link = $(elm).attr('link');
  var leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
  var topPosition = (window.screen.height / 2) - ((300 / 2) + 50);
  
  window.open("http://twitter.com/share?url=" + escape(link) + "&text=" + document.title,
               'tweet', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,left='+leftPosition+',top='+topPosition);
  return false;
}

function zoomInNode(node, diff) {
  d3.select(node).select("rect")
    .transition()
    .attr("height", 100);
  
  //move next
  var selectedGroup = d3.select(node).attr("group");
  var next = node.nextSibling;
  while (d3.select(next).attr("group") == selectedGroup && d3.select(next).attr("name") != "hidden") {
    var txy = getXYFromTranslate(d3.select(next).attr("transform"));
    d3.select(next)
      .transition()
      .attr("transform", function(d, i) { return "translate(" + parseInt(txy[0]) + ", " + (parseInt(txy[1]) + diff) + ")"});

    next = next.nextSibling;
  }
}

function zoomOutNode(node) {
  d3.select(node).select("rect")
    .transition()
    .attr("height", d3.select(node).select("rect").attr("initialHeight"));

  //back all
  var selectedGroup = d3.select(node).attr("group");
  var next = node.nextSibling;
  while (next && d3.select(next).attr("group") == selectedGroup && d3.select(next).attr("name") != "hidden") {
    d3.select(next)
      .transition()
      .attr("transform", d3.select(next).attr("initialTransform"));

    next = next.nextSibling;
  }
}

/*function zoomOutAllNodes() {
  var nodes = d3.selectAll(".node");
    //.attr("height", function(d) { });  

  console.log(nodes);
  
  nodes.select("rect")
    .transition()
    .attr("height", function(d) { return d3.select(this).attr("initialHeight") });

  nodes
    .transition()
    .attr("transform", function(d) { return d3.select(this).attr("initialTransform") });
}*/

function getXYFromTranslate(attr) {
  var split = attr.split(",");
  var x = split[0].split("(")[1];
  var y = split[1].split(")")[0];
  return [x, y];
}

function back(backTo) {
  d3.event.preventDefault();
  d3.event.stopPropagation();

  if (!backTo) {
    history = _.initial(history);
    var backTo = _.last(history);

    if (!backTo) {
      getData({name: "", group: source.group}, null);
      return;
    }
    history = _.initial(history);
  } else {
    history = _.initial(history, history.length - _.indexOf(history, backTo));
  }

  getData(backTo.source, backTo.target);
}

function sizedText(string, n) {
  if (!string) return;

  var points = '';
  if (string.length > n + 1) points = '...';
  var string = string.substring(0, n);
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() + points;
}

function urlFormat(string) {
  string = string.replace(/[^a-zA-Z0-9-_]/g, '_');
  //string = encodeURI(string);
  //console.log(string);

  return string;
}

function onNodeLeave(elm, source) {
  d3.select(elm).select(".detail-icon").classed("show", false);
  d3.select(elm).select(".back-icon").classed("show", false);

  d3.select(".halfPie").remove();
  d3.select(".halfPie2").remove();

  if (d3.select(elm).select(".detail-icon")[0][0] && d3.select(elm).select(".back-icon")[0][0]) {
    var bis = true;
  } else {
    var bis = false;
  }

  if (d3.select(elm).select("rect").attr("height") != d3.select(elm).select("rect").attr("initialHeight")) {
    zoomOutNode(elm);
  }

  if (source.name && d3.select(elm).attr("group") == source.group && d3.select(elm).attr("name") != source.name) {
    d3.select(elm).select("rect").style("fill", "#CCCCCC");
  }
  var y = d3.select(elm).select("rect").attr("initialHeight") / 2;
  d3.select(elm).select(".node-title").transition().duration(300).attr("x", 42).attr("y", y).attr("text-anchor", "start");

  if (source.group == d3.select(elm).attr("group")) {
    d3.select(elm).select(".node-title").text(sizedText(d3.select(elm).attr("name"), textLength + 10));
  } else {
    d3.select(elm).select(".node-title").text(sizedText(d3.select(elm).attr("name"), textLength));
  }
	
  if (bis) {
    d3.select(elm).select(".detail-icon").transition().duration(300).attr("y", y + 25);
    d3.select(elm).select(".back-icon").transition().duration(300).attr("y", y - 5);
  } else {
    d3.select(elm).select(".detail-icon").transition().duration(300).attr("y", y);
    d3.select(elm).select(".back-icon").transition().duration(300).attr("y", y);
  }
}
