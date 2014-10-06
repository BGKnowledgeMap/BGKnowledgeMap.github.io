halfPie = function(source, piedata) {
    d3.select(".halfPie").remove();
    d3.select(".halfPie2").remove();

    piedata = _.without(piedata, _.where(piedata, {label: d3.select(source).attr("group")})[0]);
    //var height = d3.select(source).select("rect").attr("height");
    var height = 100;
    var color = d3.scale.linear()
      .domain([0, (piedata.length/2)-1, piedata.length])
      .range([d3.select(source).select("rect").style("fill"), "#DBD1D1", d3.select(source).select("rect").style("fill")]);

    var w = 300, //width
        h = height < 100 ? 100 : height, //height
        r = h / 2, //radius
        ir = r - 8,
        r2 = r - 8,
        ir2 = 0,
        pi = Math.PI,
        color = color;

    /**interno**/
    var vis2 = d3.select(source)
        .data([piedata])          
        .append("g")
	      .attr("class", "halfPie2")
            .attr("transform", "translate(" + (d3.select(source).select("rect").attr("width")-1) + "," + r + ")");

    var arc2 = d3.svg.arc()              
        .outerRadius(r2 + 30)
	.innerRadius(ir2);
 
    var pie2 = d3.layout.pie()           
        .value(function(d) { return d.value; })
        .startAngle(0)
        .endAngle(pi);
 
    var arcs2 = vis2.selectAll("slice2")     
        .data(pie2)                          
        .enter()                            
        .append("g") 
          .attr("class", "slice2");
    
    var path2 = arcs2.append("path")
        .attr("opacity", 0.3)
        .attr("fill", "transparent")
	.attr("d", arc2)
        .transition().duration(300)
          .attr("opacity", 1);

    /**esterno**/
    var vis = d3.select(source)
        .data([piedata])          
        .append("g")
	    .attr("class", "halfPie")
            .attr("transform", "translate(" + (d3.select(source).select("rect").attr("width")-1) + "," + r + ")");

    var arc = d3.svg.arc()              
        .outerRadius(r)
        .innerRadius(ir);

    var pie = d3.layout.pie()           
        .value(function(d) { return d.value; })
        .startAngle(0)
        .endAngle(pi);
 
    var arcs = vis.selectAll("slice")     
        .data(pie)                          
        .enter()                            
        .append("g") 
          .attr("class", "slice")
	  .on(click, function(d) {
	    d3.event.preventDefault();
	    d3.event.stopPropagation();

	    var newTarget = d.data.label;
            var selectedGroup = d3.select(this.parentNode.parentNode).attr("group");//TODO no parentNode ecc
            var selectedName = d3.select(this.parentNode.parentNode).attr("name");//TODO no parentNode ecc
            //groupMap[selectedGroup].backTo = d3.select(this.parentNode.parentNode).attr("name");

            getData({name: selectedName, group: selectedGroup}, newTarget);
	  });
    
    var path = arcs.append("path")
        .attr("opacity", 0.3)
        .attr("fill", function(d, i) { return color(i); } )
	.attr("d", arc)
        .transition().duration(300)
          .attr("opacity", 1);

 
    arcs.append("text") 
        .attr("transform", function(d) {                    
          return "translate(" + arc.centroid(d) + ")";        
        })
       .attr("text-anchor", "start")
       .attr("opacity", 0.3)
       .text(function(d, i) { return piedata[i].label })
       .transition().duration(300)
          .attr("opacity", 1);
    }
