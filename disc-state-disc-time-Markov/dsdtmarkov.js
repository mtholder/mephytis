var global_draws = [];
var draw_text = "ACGT";
var draw_color = ["aqua", "darkgreen", "orange", "magenta"];
var draw_text_color = ["black", "white", "black", "white"];
var num_urns = draw_text.length;
var switch_prob = 7.0/16.0;

// slider code from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
var slider_switch_prob = d3.sliderBottom()
    .min(0.0)
    .max(1.0)
    .width(500)
    .tickFormat(d3.format('.2'))
    .ticks(10)
    .default(switch_prob)
    .on('onchange', function(val) {
        switch_prob = val;
        d3.select('#value-switch-prob')
            .text(d3.format('.2')(val));
        clear_data();
    });
var g_switch_svg = d3.select('span#switch-prob-slider')
    .append('svg')
    .attr('width', 500)
    .attr('height', 70)
    .append('g')
    .attr('transform', 'translate(30,30)');
g_switch_svg.call(slider_switch_prob);
d3.select('#value-switch-prob')
            .text(d3.format('.2')(switch_prob));
var draw_random_urn_index = function () {
    return Math.floor(Math.random() * num_urns);
};

var draw_next_bead = function(sprob) {
    if (global_draws.length == 0) {
        global_draws[0] = draw_random_urn_index();
    } else {
        var curr_ind = global_draws[global_draws.length - 1];
        var new_ind = curr_ind;
        if (Math.random() < sprob) {
            while (new_ind == curr_ind) {
                new_ind = draw_random_urn_index();
            }
        }
        global_draws[global_draws.length] = new_ind;
    }
    update_data_boxes(global_draws);
};
var clear_data = function() {
    global_draws = [];
    update_data_boxes(global_draws);
};
d3.select(".simbtn")
    .attr("onclick", "draw_next_bead(switch_prob)");
d3.select(".clearbtn")
    .attr("onclick", "clear_data()");



var update_data_boxes = function (data) {
    var drawboxes = d3.select(".drawcont")
            .selectAll("span")
            .data(data);
    drawboxes.enter()
        .append("span")
        .attr("class", "block")
        .style("width", function(d) {return "10pt";})
        .style("background-color", function(d) {return draw_color[d];})
        .style("color", function(d) {return draw_text_color[d];})
        .text(function(d) { return draw_text[d];});
    drawboxes.exit()
        .remove();
};
