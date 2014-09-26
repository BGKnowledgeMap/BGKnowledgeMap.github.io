var circleStartX = 75;
var circleDist = 150;
var maxItems = Math.round(($(window).width() - circleStartX * 2) / circleDist);

var b_svg = d3.select("#breadcrumb").append("svg")
  .attr("width", $(window).width())
  .append("g");

function updateBreadcrumb(myhistory) {
  b_svg.selectAll("g").remove();

  var step = b_svg.selectAll(".step").data(_.last(myhistory, maxItems));

  var lines = step.enter().append("g");

  lines.append("line")
    .attr("x1", function(d, i) {
      return circleStartX + circleDist * i;
    })
    .attr("y1", 50)
    .attr("x2", function(d, i) {
        return circleStartX + circleDist * (i + 1);
    })
    .attr("y2", 50)
    .attr("stroke-width", 2)
    .attr("stroke", "black")
    .style("stroke-dasharray", ("3, 3"))
    .style("opacity", "0.4")
    .attr("class", function(d, i) {
      if ((i + 1) == _.last(myhistory, maxItems).length) return "last";
    });
  
  var circles = step.enter().append("g");

  circles.append("circle").attr("r", 10)
    .attr("fill", "#ffaaaa")
    .attr("cy", 50)
    .attr("cx", function(d, i) {
      return circleStartX + circleDist * i;
    })
    .on("click", function(d) {
      back(d);
    });

  circles.append("text")
    .attr("class", "breadcrumb-text")
    .attr("x", function(d, i) {
      return circleStartX + circleDist * i;
    })
    .attr("y", function(d, i) {
      if (i%2) return 35;
      else return 75;
    })
    .attr("text-anchor", "middle")
    .text(function(d) { return sizedText(d.source.name, 29) });

  circles.append("text")
    .attr("class", "breadcrumb-text")
    .attr("x", function(d, i) {
      return circleStartX + circleDist * i;
    })
    .attr("y", function(d, i) {
      if (i%2) return 25;
      else return 85;
    })
    .attr("text-anchor", "middle")
    .text(function(d) { return d.target ? d.target : 'HOME' });

  //step.exit().remove(); TODO
}


