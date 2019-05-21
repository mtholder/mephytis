var global_draws = [];
var draw_text = "ACGT";
var draw_color = ["aqua", "darkgreen", "orange", "magenta"];
var draw_text_color = ["black", "white", "black", "white"];
var num_urns = draw_text.length;
var switch_prob = 7.0/16.0;

var draw_random_urn_index = function () {
    return Math.floor(Math.random() * num_urns);
}

var draw_next_bead = function() {
    if (global_draws.length == 0) {
        global_draws[0] = draw_random_urn_index();
    } else {
        var curr_ind = draw_random_urn_index();
        var new_ind = curr_ind;
        if (Math.random() < switch_prob) {
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
    .attr("onclick", "draw_next_bead()");
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
