var global_draws = [];
var draw_text = "ACGT";
var draw_color = ["aqua", "darkgreen", "orange", "magenta"];
var draw_text_color = ["black", "white", "black", "white"];
var num_urns = draw_text.length;

var switch_prob = 7.0/16.0;
var num_samples_per_click = 1;
var g_s_hat = '?';
var using_ln_scale = true;

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
    update_inference(global_draws);
};
var clear_data = function() {
    global_draws = [];
    update_data_boxes(global_draws);
    update_inference(global_draws);
};
d3.select(".simbtn")
    .attr("onclick", "draw_next_bead(switch_prob)");
d3.select(".clearbtn")
    .attr("onclick", "clear_data()");
d3.select("#logtransform")
    .attr("onclick", "toggle_scaling()");

var update_inference = function(data) {
    var sum_stats = update_summary_stats(data);
    update_likelihood_plots(sum_stats);
};

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
    return {"nd": nd, "ns": ns, "n": data.length};
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


var like_width = 520;
var like_height = 400;
var like_margin = {top: 20, right: 30, bottom: 30, left: 70};
var min_y_for_scaling = 0;
var like_x = d3.scaleLinear()
        .domain([0.0, 1.00001])
        .range([like_margin.left, like_width - like_margin.right]);
var like_y = d3.scaleLinear()
        .domain([0.0, 1.00001])
        .range([like_height - like_margin.bottom, like_margin.top]);
var ln_like_ln_scale_y = d3.scaleLog()
    .domain([1e-6, 1.00001])
    .range([like_height - like_margin.bottom, like_margin.top]);
var ln_like_linear_scale_y = d3.scaleLinear()
    .domain([Math.log(1e-6), 0.00001])
    .range([like_height - like_margin.bottom, like_margin.top]);
var y_scaler, line_func;

var s_scaler = function(d) {return like_x(d.s);};
var l_scaler = function(d) {return like_y(d.likelihood);};
var lnl_scaler = function(d) {return ln_like_linear_scale_y(d.ln_likelihood);}
var like_line_f = d3.line()
            .x(s_scaler)
            .y(l_scaler);
var ln_like_line_f = d3.line()
            .x(s_scaler)
            .y(lnl_scaler);

var like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height - like_margin.bottom)
    .y1(l_scaler);
var ln_like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height)
    .y1(lnl_scaler);
var shading_func;

var set_scaling = function() {
    if (using_ln_scale) {
        y_scaler = ln_like_linear_scale_y;
        line_func = ln_like_line_f;
        shading_func = ln_like_shading
    } else {
        y_scaler = like_y;
        line_func = like_line_f;
        shading_func = like_shading;
    }
};

set_scaling();

var toggle_scaling = function() {
    var title_element = d3.select("#tracetitle");
    var button_element = d3.select("#logtransform");
    if (using_ln_scale) {
        button_element.text("Move to log scale");
        title_element.text("Likelihood");
    } else {
        button_element.text("Move to probability scale");
        title_element.text("Ln Likelihood");
    }
    using_ln_scale = ! using_ln_scale;
    set_scaling();
    update_inference(global_draws);

};

var xapos = like_height - like_margin.bottom;
var like_x_axis = function(el) {
    el.attr("transform", "translate(0, " + xapos + ")")
        .call(d3.axisBottom(like_x).ticks(10).tickSizeOuter(0));
};

var like_y_axis = function(el) {
    el.attr("transform", "translate(" + like_margin.left + ", 0)")
        .call(d3.axisLeft(y_scaler).ticks(10).tickSizeOuter(0));
};

var like_svg = d3.select("#likelihood-trace-div")
    .append("svg")
        .attr("id", "likeplot")
        .attr("width", like_width)
        .attr("height", like_height);


var calc_like = function(sum_stats, switch_bin_prob) {
    var nti = sum_stats.nd + sum_stats.ns;
    if (nti == 0) {
        if (sum_stats.n == 0) {
            return 1.0;
        }
        return 0.25;
    }
    var third_of_switch = switch_bin_prob/3.0;
    var nonswitch = 1.0 - switch_bin_prob;
    return 0.25*Math.pow(third_of_switch, sum_stats.nd)*Math.pow(nonswitch, sum_stats.ns);
};

var calc_ln_like = function(sum_stats, switch_bin_prob) {
    var ns = sum_stats.ns;
    var nd = sum_stats.nd;
    var nti = nd + ns;
    if (nti == 0) {
        if (sum_stats.n == 0) {
            return 0.0;
        }
        return Math.log(0.25);
    }
    var third_of_switch = switch_bin_prob/3.0;
    var nonswitch = 1.0 - switch_bin_prob;
    return Math.log(0.25) + nd*Math.log(third_of_switch) + ns*Math.log(nonswitch);
};

var create_like_plot_points = function(sum_stats) {
    var num_points = 501;
    var step_size = 1.0/(num_points - 1);
    var like_points = [];
    var cur_s = 0.0;
    var i;
    for (i = 0; i < num_points; ++i) {
        var lnl = calc_ln_like(sum_stats, cur_s);
        if (isNaN(lnl)) {
            console.log("Skipping s=" + cur_s + " which gave NaN for lnL\n");
        } else if (lnl < -1e150) {
            console.log("Skipping s=" + cur_s + " which gave -infinity lnL\n");
        } else {
            like_points.push({"s": cur_s,
                              "likelihood": Math.exp(lnl),
                              "ln_likelihood": lnl});
        }
        cur_s = cur_s + step_size;
    }
    return like_points;
};

var crop_to_points_in_ci = function(points, max_ln_l, ln_l_diff) {
    var cutoff;
    if (using_ln_scale) {
        cutoff = max_ln_l - ln_l_diff;
    } else {
        cutoff = max_ln_l/Math.exp(ln_l_diff);
    }
    var filtered = [];
    var curr_score;
    var el, i;
    for (i = 0 ; i < points.length; ++i) {
        el = points[i];
        if (using_ln_scale) {
            curr_score = el.ln_likelihood;
        } else {
            curr_score = el.likelihood;
        }
        if (curr_score >= cutoff) {
            filtered.push(el);
        }
    }
    return filtered;
};

var update_likelihood_plots = function(sum_stats){
    var lp = create_like_plot_points(sum_stats);
    var ydmin, ydmax;
    if (using_ln_scale) {
        if (like_line_f == line_func) {
            ydmax = d3.max(lp, function (d) {return d.likelihood;});
            ydmin = ydmax/1e6;
        } else {
            ydmax = d3.max(lp, function (d) {return d.ln_likelihood;});
            ydmin = ydmax - 12;
        }
    } else {
        ydmax = d3.max(lp, function (d) {return d.likelihood;});
        ydmin = min_y_for_scaling;
    }
    var alp = crop_to_points_in_ci(lp, ydmax, 1.92);
    y_scaler.domain([ydmin, ydmax]);
    like_svg.transition();
    var moving = like_svg.transition();
    moving.select(".line")
        .duration(500)
        .attr("d", line_func(lp));
    moving.select(".area")
        .duration(500)
        .attr("d", shading_func(alp));
    moving.select(".y.axis")
        .duration(500)
        .call(like_y_axis);
};
var like_points = create_like_plot_points({"nd":0, "ns":0, "n":0});
var darr = like_line_f(like_points);
var darea_arr = shading_func(like_points);
like_svg.append("path")
       .data(like_points)
       .attr("class", "area")
       .attr("d", darea_arr);

like_svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("class", "line")
    .attr("d", darr);
like_svg.append("g").call(like_x_axis);
like_svg.append("g")
    .attr("class", "y axis")
    .call(like_y_axis);

like_svg.append("text")
      .attr("transform",
            "translate(" + (like_width/2) + " ," +
                           (xapos + 25) + ")")
      .style("text-anchor", "middle")
      .style("font-style", "italic")
      .text("s");
