var global_draws = [];
var draw_text = "ACGT";
var draw_color = ["aqua", "darkgreen", "orange", "magenta"];
var draw_text_color = ["black", "white", "black", "white"];
var num_urns = draw_text.length;

var switch_prob = 7.0/16.0;
var num_samples_per_click = 1;
var g_s_hat = '?';

////////////////////////////////////////////////////////////////////////////////////////////////////
// slider code from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
// relying on d3-simple-slider
var slider_switch_prob = d3.sliderBottom()
    .min(0.0)
    .max(1.0)
    .width(450)
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

var slider_num_obs = d3.sliderBottom()
    .min(1)
    .max(100)
    .step(1)
    .width(450)
    .ticks(10)
    .default(num_samples_per_click)
    .on('onchange', function(val) {
        var fv = Math.floor(val);
        num_samples_per_click = fv;
        d3.select('#btn-num-obs')
            .text(d3.format(">3d")(num_samples_per_click));
    });
var g_num_obs_svg = d3.select('span#num-obs-slider')
    .append('svg')
    .attr('width', 500)
    .attr('height', 70)
    .append('g')
    .attr('transform', 'translate(30,30)');
g_num_obs_svg.call(slider_num_obs);
d3.select('#value-num-obs')
            .text(num_samples_per_click);
d3.select('#btn-num-obs')
            .text(d3.format(">3d")(num_samples_per_click));

////////////////////////////////////////////////////////////////////////////////////////////////////


var draw_random_urn_index = function () {
    return Math.floor(Math.random() * num_urns);
};

var draw_next_bead = function(sprob) {
    for (i = 0; i < num_samples_per_click; ++i) {
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
    }
    update_data_boxes(global_draws);
    update_summary_stats(global_draws);
};
var clear_data = function() {
    global_draws = [];
    update_data_boxes(global_draws);
    update_summary_stats(global_draws);
};
d3.select(".simbtn")
    .attr("onclick", "draw_next_bead(switch_prob)");
d3.select(".clearbtn")
    .attr("onclick", "clear_data()");

var update_summary_stats = function(data) {
    var ns = 0;
    var nd = 0;
    var i;
    if (data.length > 1) {
        for (i = 1; i < data.length; ++i) {
            if (data[i] == data[i - 1]) {
                ns = ns + 1;
            } else {
                nd = nd + 1;
            }
        }
    }
    d3.select("#value-ndiffs").text(nd);
    d3.select("#value-nsame").text(ns);
    d3.select("#value-ntransitions").text(ns + nd);
    if (ns + nd == 0) {
        g_s_hat = '?';
        d3.select("#value-estimate-of-s").text(g_s_hat);
    } else {
        g_s_hat = nd/(nd + ns);
        d3.select("#value-estimate-of-s").text(d3.format(".3f")(g_s_hat));
    }

};

var update_data_boxes = function (data) {
    d3.select("#samplesize").text(data.length);
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

var like_width = 500;
var like_height = 400;

var like_margin = ({top: 20, right: 30, bottom: 30, left: 50});
var like_x = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([like_margin.left, like_width - like_margin.right]);
var like_x_axis = function(el) {
    el.attr("transform", "translate(0, " + like_height - like_margin.bottom + ")")
        .call(d3.axisBottom(like_x).ticks(10).tickSizeOuter(0));
};
var like_svg = d3.select("#likelihood-trace-div")
    .append("svg")
    .attr("width", like_width)
    .attr("height", like_height);
like_svg.append("g").call(like_x_axis);

/*

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

  return svg.node();
}
*/