/*jslint indent: 2 */
/*globals d3 */
var SQRT_2 = Math.sqrt(2);
function createFourLeafUnrootedTree(spec) {
  "use strict";
  var maxEdgeLen = spec.maxEdgeLen || 0.5;
  var LEFT_INTERNAL_X_FRAC = SQRT_2 / (1 + 2 * SQRT_2);
  var F = {};
  var edgeLenToXCoord = function (edgeChangeProbArray, i) {
    var d = edgeChangeProbArray[i];
    var frac;
    if (i === 0 || i === 1) {
      frac = LEFT_INTERNAL_X_FRAC - (d * SQRT_2 / maxEdgeLen);
    } else if (i === 2 || i === 3) {
      frac = LEFT_INTERNAL_X_FRAC + ((d * SQRT_2) + edgeChangeProbArray[4]) / maxEdgeLen; // depends on internal node, implicitly
    } else if (i === 4) {
      frac = LEFT_INTERNAL_X_FRAC + (d / maxEdgeLen);
    } else {
      console.log("edgeLenEndToXCoord i > 4: i=" + i);
      frac = LEFT_INTERNAL_X_FRAC;
    }
    return frac;
  };
  var edgeLenEndToXCoord = function (edgeChangeProbArray, i) {
    var d;
    var frac;
    if (i === 0 || i === 1 || i === 4) {
      d = edgeChangeProbArray[i];
      frac = LEFT_INTERNAL_X_FRAC;
    } else if (i === 2 || i === 3) {
      frac = LEFT_INTERNAL_X_FRAC + (edgeChangeProbArray[4] / maxEdgeLen); // depends on internal node, implicitly
    } else {
      console.log("edgeLenEndToXCoord i > 4: i=" + i);
    }
    return frac;
  };
  var edgeLenToYCoord = function (edgeChangeProbArray, i) {
    var frac = i / 5.0;
    if (i === 0 || i === 2) {
      frac = 0;
    } else if (i === 1 || i === 3) {
      frac = 1;
    } else {
      console.log("edgeLenToXCoord i > 5: i=" + i);
      frac = 0.5;
    }
    return frac;
  };
  var edgeLenEndToYCoord = function (edgeChangeProbArray, i) {
    var frac = 0.5;
    return frac;
  };
  F.edgeChangeProbArrayToEdgeRelativeCoord = function (edgeChangeProbArray) {
    var i, x1, x2, y1, y2, cp;
    var relCoordArray = [];
    for (i = 0; i < 5; ++i) {
      cp = edgeChangeProbArray[i];
      x1 = edgeLenToXCoord(edgeChangeProbArray, i);
      x2 = edgeLenEndToXCoord(edgeChangeProbArray, i);
      y1 = edgeLenToYCoord(edgeChangeProbArray, i);
      y2 = edgeLenEndToYCoord(edgeChangeProbArray, i);
      console.log("(" + x1 + ", " + y1 + ") -> (" + x2 + ", " + y2 + ")");
      relCoordArray[i] = [{x: x1, y: y1}, {x: x2, y: y2}];
    }
    return relCoordArray;
  };
  return F;
}

function createMephytis(spec) {
  "use strict";
  var M = {};
  M.createUnrootedFourLeafTreeWidget = function (spec) {
    /**
     *   0         2
     *    \       /
     *     5*====4
     *    /       \
     *   1        3
     *
     * Slot 5 is added as a dummy for the central node which has no branch to manage
     **/
    var fourLeafTree = createFourLeafUnrootedTree(spec);
    var edgeCoordinates = fourLeafTree.edgeChangeProbArrayToEdgeRelativeCoord(spec.edgeChangeProbArray);
    var nodeCoordinates = [];
    var svgNodeSelector = spec.svgNodeSelector;
    var svgEdgeSelector = spec.svgEdgeSelector;
    var margin = (spec.margin !== undefined ? spec.margin : 15);
    var leftMargin = (spec.leftMargin !== undefined ? spec.leftMargin : margin);
    var rightMargin = (spec.rightMargin !== undefined ? spec.rightMargin : margin);
    var topMargin = (spec.topMargin !== undefined ? spec.topMargin : margin);
    var bottomMargin = (spec.bottomMargin !== undefined ? spec.bottomMargin : margin);
    var treePanelWidth = spec.panelWidth || 360;
    var treePanelHeight = spec.panelHeight || 180;
    var xScaler = d3.scale.linear().domain([0.0, 1.0]).range([leftMargin, treePanelWidth - rightMargin]);
    var yScaler = d3.scale.linear().domain([0.0, 1.0]).range([topMargin, treePanelHeight - bottomMargin]);
    var svg = d3.select(spec.parentElID).append("svg")
          .attr("width", treePanelWidth)
          .attr("height", treePanelHeight);
    var nodeSelected = svg.selectAll(svgNodeSelector);
    var edgeSelected = svg.selectAll(svgEdgeSelector);
    nodeCoordinates[0] = edgeCoordinates[0][0];
    nodeCoordinates[1] = edgeCoordinates[1][0];
    nodeCoordinates[2] = edgeCoordinates[2][0];
    nodeCoordinates[3] = edgeCoordinates[3][0];
    nodeCoordinates[4] = edgeCoordinates[4][0];
    nodeCoordinates[5] = edgeCoordinates[0][1];
    console.log("Node(" + nodeCoordinates[0].x + ", " + nodeCoordinates[0].y + ")");
    console.log("nodeCoordinates = " + nodeCoordinates);
    console.log("edgeCoordinates = " + edgeCoordinates);
    /*nodeSelected.data(nodeCoordinates)
      .enter().append("circle")
        .attr("class", "little")
        .attr("cx", function (d) {
        return xScaler(d.x);
      })
        .attr("cy", function (d) {
        return yScaler(d.y);
      })
        .attr("r", 3);*/
    svg.selectAll('.slopes')
      .data(edgeCoordinates)
      .enter().append('svg:line')
      .attr("x1", function (d) {
        console.log("x1 = " + d[0].x);
        return xScaler(d[0].x);
      })
      .attr("y1", function (d) {
        console.log("y1 = " + d[0].y);
        return yScaler(d[0].y);
      })
      .attr("x2", function (d) {
        console.log("x2 = " + d[1].x);
        return xScaler(d[1].x);
      })
      .attr("y2", function (d) {
        console.log("y2 = " + d[1].y);
        return yScaler(d[1].y);
      })
      .attr('stroke', 'black');
    /*
    var line = d3.svg.line()
      .x(function (d) { return xScaler(d.x); })
      .y(function (d) { return yScaler(d.y); })
      .interpolate("linear");
    svg.append("path")
      .data(edgeCoordinates)
        .attr("d", line);
    */
    /* append("line")//x="0" y="0" width="50" height="50" fill="green"
      ;*/
    return {node: nodeSelected,
      edge: edgeSelected};
  };
  return M;
}