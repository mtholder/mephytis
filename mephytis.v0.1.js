/*jslint indent: 2 */
/*globals d3 */
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
    var SQRT_2 = Math.sqrt(2);
    var LEFT_INTERNAL_X_FRAC = SQRT_2 / (1 + 2 * SQRT_2);
    var margin = (spec.margin !== undefined ? spec.margin : 15);
    var leftMargin = (spec.leftMargin !== undefined ? spec.leftMargin : margin);
    var rightMargin = (spec.rightMargin !== undefined ? spec.rightMargin : margin);
    var topMargin = (spec.topMargin !== undefined ? spec.topMargin : margin);
    var bottomMargin = (spec.bottomMargin !== undefined ? spec.bottomMargin : margin);
    var edgeChangeProbArray = spec.edgeChangeProbArray;
    var maxEdgeLen = spec.maxEdgeLen || 0.5;
    var treePanelWidth = spec.panelWidth || 360;
    var treePanelHeight = spec.panelHeight || 180;
    var xScaler = d3.scale.linear().domain([0.0, 1.0]).range([leftMargin, treePanelWidth - rightMargin]);
    var yScaler = d3.scale.linear().domain([0.0, 1.0]).range([topMargin, treePanelHeight - bottomMargin]);
    edgeChangeProbArray[5] = 0; // add a dummy to deal with the fact that 
    var edgeLen2XCoord = function (d, i) {
      var frac;
      if (i === 0 || i === 1) {
        frac = LEFT_INTERNAL_X_FRAC - (d * SQRT_2 / maxEdgeLen);
      } else if (i === 2 || i === 3) {
        frac = LEFT_INTERNAL_X_FRAC + ((d * SQRT_2) + edgeChangeProbArray[4]) / maxEdgeLen; // depends on internal node, implicitly
      } else if (i === 4) {
        frac = LEFT_INTERNAL_X_FRAC + (d / maxEdgeLen);
      } else {
        if (i > 5) {
          console.log("edgeLen2XCoord i > 5: i=" + i);
        }
        frac = LEFT_INTERNAL_X_FRAC;
      }
      var r = xScaler(frac);
      console.log("edgeLen2XCoord d=" + d + " i=" + i + " frac=" + frac + " r=" + r);
      return r;
    };
    var edgeLen2YCoord = function (d, i) {
      var frac = i / 5.0;
      if (i === 0 || i === 2) {
        frac = 0;
      } else if (i === 1 || i === 3) {
        frac = 1;
      } else {
        if (i > 5) {
          console.log("edgeLen2XCoord i > 5: i=" + i);
        }
        frac = 0.5;
      }
      var r = yScaler(frac);
      console.log("edgeLen2YCoord d=" + d + " i=" + i + " frac=" + frac + " r=" + r);
      return r;
    };
    var svg = d3.select(spec.parentElID).append("svg")
          .attr("width", treePanelWidth)
          .attr("height", treePanelHeight);
    svg.selectAll(".little")
      .data(edgeChangeProbArray)
      .enter().append("circle")
        .attr("class", "little")
        .attr("cx", edgeLen2XCoord)
        .attr("cy", edgeLen2YCoord)
        .attr("r", 3);
  };
  return M;
}