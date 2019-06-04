var global_draws = [];
var filtered_draws = [];
var num_missing = 0;
var draw_text = "ACGT?";
var draw_color = ["aqua", "darkgreen", "orange", "magenta", "lightgrey"];
var draw_text_color = ["black", "white", "black", "white", "black"];
var num_urns = 4;
var MISSING_CODE = 4;

var switch_prob = 0.5;
var num_samples_per_click = 1;
var g_s_hat = '?';
var using_ln_scale = true;

var missing_prob_total = 0.5; // =switch_prob*missing_prob_diff + (1-switch_prob)*missing_prob_same
var miss_bias_goal = 2.0; // desired missing_prob_diff/missing_prob_same
var missing_prob_diff = 0.5;
var missing_prob_same = 0.5;
var use_bias_in_missing_data = false;

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

var slider_missing_prob = d3.sliderBottom()
    .min(0.0)
    .max(1.0)
    .width(450)
    .tickFormat(d3.format('.2'))
    .ticks(10)
    .default(missing_prob_total)
    .on('onchange', function(val) {
        set_missing_prob_total(val);
        d3.select('#value-missing-prob')
            .text(d3.format('.2')(val));
        clear_data();
    });
var g_missing_svg = d3.select('span#missing-prob-slider')
    .append('svg')
    .attr('width', 500)
    .attr('height', 70)
    .append('g')
    .attr('transform', 'translate(30,30)');
g_missing_svg.call(slider_missing_prob);
d3.select('#value-missing-prob')
            .text(d3.format('.2')(missing_prob_total));

var slider_num_obs = d3.sliderBottom()
    .min(1)
    .max(100)
    .step(1)
    .width(450)
    .ticks(10)
    .default(num_samples_per_click)
    .on('onchange', function(val) {
        num_samples_per_click = Math.floor(val);
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
var set_missing_prob_total = function(val) {
    missing_prob_total = val;
    clear_data();
};

var trigger_conditional_missing_prob_recalc = function() {
    if (use_bias_in_missing_data) {
        var frac_same = 1 - switch_prob;
        var b = miss_bias_goal;
        missing_prob_diff = b*missing_prob_total/(frac_same + b - b*frac_same);
        if (missing_prob_diff > 1.0) {
            missing_prob_diff = 1.0;
            missing_prob_same = (missing_prob_total + frac_same - 1)/frac_same;
        } else {
            missing_prob_same = missing_prob_diff/b;
        }
    } else {
        missing_prob_diff = missing_prob_total;
        missing_prob_same = missing_prob_total;
    }
};

var draw_random_urn_index = function () {
    return Math.floor(Math.random() * num_urns);
};

var draw_next_bead = function(sprob) {
    var missing_prob, i;
    for (i = 0; i < num_samples_per_click; ++i) {
        var next_ind = global_draws.length;
        missing_prob = missing_prob_same;
        if (next_ind == 0) {
            global_draws[next_ind] = draw_random_urn_index();
            missing_prob = missing_prob_same;
        } else {
            var curr_ind = global_draws[global_draws.length - 1];
            var new_ind = curr_ind;
            if (Math.random() < sprob) {
                while (new_ind == curr_ind) {
                    new_ind = draw_random_urn_index();
                }
                missing_prob = missing_prob_diff;
            }
            global_draws[next_ind] = new_ind;
        }
        if (Math.random() < missing_prob) {
            filtered_draws[next_ind] = MISSING_CODE;
            num_missing = num_missing + 1;
        } else {
            filtered_draws[next_ind] = global_draws[next_ind];
        }
    }
    update_data_boxes(filtered_draws);
    update_inference(filtered_draws);
};
var clear_data = function() {
    global_draws = [];
    filtered_draws = [];
    num_missing = 0;
    trigger_conditional_missing_prob_recalc();
    update_data_boxes(filtered_draws);
    update_inference(filtered_draws);
};
d3.select(".simbtn")
    .attr("onclick", "draw_next_bead(switch_prob)");
d3.select(".clearbtn")
    .attr("onclick", "clear_data()");
d3.select("#logtransform")
    .attr("onclick", "toggle_scaling()");
d3.select("#dobias")
    .attr("onclick", "toggle_bias()");

var update_inference = function(data) {
    var sum_stats = update_summary_stats(data);
    update_likelihood_plots(sum_stats);
};

var _pad_ss_arr = function(ss_arr, ind, has_seen_a_base) {
    while (ind >= ss_arr.length) {
        ss_arr.push(null);
    }
    if (ss_arr[ind] === null) {
        ss_arr[ind] = {"nd":0, "ns": 0, "atleastone": has_seen_a_base};
    }
};

var add_change = function(ss_arr, ind, has_seen_a_base){
    _pad_ss_arr(ss_arr, ind, has_seen_a_base);
    ss_arr[ind].nd = 1 + ss_arr[ind].nd;
};

var add_non_change = function(ss_arr, ind, has_seen_a_base){
    _pad_ss_arr(ss_arr, ind, has_seen_a_base);
    ss_arr[ind].ns = 1 + ss_arr[ind].ns;
};

var update_summary_stats = function(data) {
    var ss_arr = [];
    var i;
    var consec_num_missing = 0;
    var prev_non_missing = null;
    var has_seen_a_base = false;
    _pad_ss_arr(ss_arr, 0, has_seen_a_base);
    if (data.length == 0) {
        // pass
    } else if (data[0] == MISSING_CODE) {
        consec_num_missing = 1;
    } else {
        prev_non_missing = data[0];
        ss_arr[0].atleastone = true;
        has_seen_a_base = true;
    }
    for (i = 1; i < data.length; ++i) {
        if (data[i] == MISSING_CODE) {
            consec_num_missing = consec_num_missing + 1;
        } else {
            has_seen_a_base = true;
            if (ss_arr.length > 0) {
                ss_arr[ss_arr.length -1].atleastone = true;
            }
            if (data[i - 1] == MISSING_CODE) {
                if (prev_non_missing === null) {
                    // no op
                } else if (data[i] == prev_non_missing) {
                    add_non_change(ss_arr, consec_num_missing, true);
                } else {
                    add_change(ss_arr, consec_num_missing, true);
                }
            } else {
                if (data[i] == data[i - 1]) {
                    add_non_change(ss_arr, consec_num_missing, true);
                } else {
                    add_change(ss_arr, consec_num_missing, true);
                }
            }
            consec_num_missing = 0;
            prev_non_missing = data[i];
        }
    }
    var nmn = ss_arr[0].ns + ss_arr[0].nd;
    d3.select("#value-ndiffs").text(ss_arr[0].nd);
    d3.select("#value-nsame").text(ss_arr[0].ns);
    d3.select("#value-ntransitions").text(nmn);
    if (nmn == 0) {
        g_s_hat = '?';
        d3.select("#value-estimate-of-s").text(g_s_hat);
    } else {
        g_s_hat = ss_arr[0].nd/nmn;
        d3.select("#value-estimate-of-s").text(d3.format(".3f")(g_s_hat));
    }
    return ss_arr;
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
var ln_like_linear_scale_y = d3.scaleLinear()
    .domain([Math.log(1e-6), 0.00001])
    .range([like_height - like_margin.bottom, like_margin.top]);
var ss_like_y = d3.scaleLinear()
        .domain([0.0, 1.00001])
        .range([like_height - like_margin.bottom, like_margin.top]);
var ss_ln_like_linear_scale_y = d3.scaleLinear()
    .domain([Math.log(1e-6), 0.00001])
    .range([like_height - like_margin.bottom, like_margin.top]);
var y_scaler, line_func, ss_y_scaler, ss_line_func;

var s_scaler = function(d) {return like_x(d.s);};
var l_scaler = function(d) {return like_y(d.likelihood);};
var lnl_scaler = function(d) {return ln_like_linear_scale_y(d.ln_likelihood);};
var ss_l_scaler = function(d) {return ss_like_y(d.likelihood);};
var ss_lnl_scaler = function(d) {return ss_ln_like_linear_scale_y(d.ln_likelihood);};
var like_line_f = d3.line()
            .x(s_scaler)
            .y(l_scaler);
var ln_like_line_f = d3.line()
            .x(s_scaler)
            .y(lnl_scaler);
var ss_like_line_f = d3.line()
            .x(s_scaler)
            .y(ss_l_scaler);
var ss_ln_like_line_f = d3.line()
            .x(s_scaler)
            .y(ss_lnl_scaler);

var like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height - like_margin.bottom)
    .y1(l_scaler);
var ln_like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height)
    .y1(lnl_scaler);
var ss_like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height - like_margin.bottom)
    .y1(ss_l_scaler);
var ss_ln_like_shading = d3.area()
    .x(s_scaler)
    .y0(like_height)
    .y1(ss_lnl_scaler);
var shading_func = ln_like_shading;
var ss_shading_func = ss_ln_like_shading;

var set_scaling = function() {
    if (using_ln_scale) {
        y_scaler = ln_like_linear_scale_y;
        line_func = ln_like_line_f;
        shading_func = ln_like_shading;
        ss_y_scaler = ss_ln_like_linear_scale_y;
        ss_line_func = ss_ln_like_line_f;
        ss_shading_func = ss_ln_like_shading;
    } else {
        y_scaler = like_y;
        line_func = like_line_f;
        shading_func = like_shading;
        ss_y_scaler = ss_like_y;
        ss_line_func = ss_like_line_f;
        ss_shading_func = ss_like_shading;
    }
};

set_scaling();
var toggle_bias = function() {
    use_bias_in_missing_data = document.getElementById("dobias").checked;
    clear_data();
};


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
    update_inference(filtered_draws);

};

var xapos = like_height - like_margin.bottom;
var like_x_axis = function(el) {
    el.attr("transform", "translate(0, " + xapos + ")")
        .call(d3.axisBottom(like_x).ticks(10).tickSizeOuter(0));
};

var like_y_axis = function(el) {
    el.attr("color", "blue");
    el.attr("transform", "translate(" + like_margin.left + ", 0)")
        .call(d3.axisLeft(y_scaler).ticks(10).tickSizeOuter(0));
};

var ss_like_y_axis = function(el) {
    el.attr("color", "red");
    el.attr("transform", "translate(" + (like_width - like_margin.right) + ", 0)")
        .call(d3.axisRight(ss_y_scaler).ticks(10).tickSizeOuter(0));
};


var like_svg = d3.select("#likelihood-trace-div")
    .append("svg")
        .attr("id", "likeplot")
        .attr("width", like_width)
        .attr("height", like_height);


var calc_ln_like = function(sum_stats, switch_bin_prob) {
    var ns = sum_stats.ns;
    var nd = sum_stats.nd;
    var nti = nd + ns;
    if (nti == 0) {
        return (sum_stats.atleastone ? Math.log(0.25) : 0.0);
    }
    var third_of_switch = switch_bin_prob/3.0;
    var nonswitch = 1.0 - switch_bin_prob;
    return Math.log(0.25) + nd*Math.log(third_of_switch) + ns*Math.log(nonswitch);
};

// forward algorithm with prob=1 for emitted states
var create_forward_prob_table = function(len, s) {
    var prev = [1.0, 0.0, 0.0, 0.0];
    var fpt = [];
    var i, j, k;
    var oms = 1.0 - s;
    var ots = s/(num_urns - 1.0);
    for (i = 0; i < len; ++i) {
        var next = [];
        for (j = 0; j < num_urns; ++j) {
            var tmp = 0.0;
            for (k = 0; k < num_urns; ++k) {
                if (k == j) {
                    tmp += prev[k]*oms;
                } else {
                    tmp += prev[k]*ots;
                }
            }
            next[j] = tmp;
        }
        fpt[i] = next;
        prev = next;
    }
    return fpt;
};

var calc_missing_data_ln_like = function(sum_stats, forward_prob_table){
    var i, el;
    var ln_l = 0;
    for (i = 1; i < sum_stats.length; ++i) {
        el = sum_stats[i];
        if (el === null) {
            // pass
        } else {
            if (el.ns > 0) {
                ln_l += el.ns*Math.log(forward_prob_table[i][0]);
            }
            if (el.nd > 0) {
                ln_l += el.nd*Math.log(forward_prob_table[i][1]);
            }
        }
    }
    return ln_l;
};

var create_like_plot_points = function(sum_stats) {
    var num_points = 501;
    var step_size = 1.0/(num_points - 1);
    var ss_like_points = [];
    var full_like_points = [];
    var cur_s = 0.0;
    var i;
    for (i = 0; i < num_points; ++i) {
        var forward_prob_table = create_forward_prob_table(sum_stats.length, cur_s);
        var lnl = calc_ln_like(sum_stats[0], cur_s);
        if (isNaN(lnl)) {
            console.log("Skipping s=" + cur_s + " which gave NaN for lnL\n");
        } else if (lnl < -1e150) {
            console.log("Skipping s=" + cur_s + " which gave -infinity lnL\n");
        } else {
            ss_like_points.push({"s": cur_s,
                              "likelihood": Math.exp(lnl),
                              "ln_likelihood": lnl});
            var mdlnl = calc_missing_data_ln_like(sum_stats, forward_prob_table);
            if (isNaN(mdlnl)) {
                console.log("Skipping s=" + cur_s + " which gave NaN for md lnL\n");
            } else if (mdlnl < -1e150) {
                console.log("Skipping s=" + cur_s + " which gave -infinity md lnL\n");
            } else {
                var totlnl = mdlnl + lnl;
                full_like_points.push({"s": cur_s,
                              "likelihood": Math.exp(totlnl),
                              "ln_likelihood": totlnl});
            }
        }
        cur_s = cur_s + step_size;
    }
    return [full_like_points, ss_like_points];
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
    var full_sum = create_like_plot_points(sum_stats);
    var ss_lp = full_sum[1];
    var full_lp = full_sum[0];
    var ss_ydmin, ss_ydmax, full_ydmin, full_ydmax;
    if (using_ln_scale) {
        if (ss_like_line_f == ss_line_func) {
            ss_ydmax = d3.max(ss_lp, function (d) {return d.likelihood;});
            ss_ydmin = ss_ydmax/1e6;
            full_ydmax = d3.max(full_lp, function (d) {return d.likelihood;});
            full_ydmin = full_ydmax/1e6;
        } else {
            ss_ydmax = d3.max(ss_lp, function (d) {return d.ln_likelihood;});
            ss_ydmin = ss_ydmax - 12;
            full_ydmax = d3.max(full_lp, function (d) {return d.ln_likelihood;});
            full_ydmin = full_ydmax - 12;
        }
    } else {
        ss_ydmax = d3.max(ss_lp, function (d) {return d.likelihood;});
        ss_ydmin = min_y_for_scaling;
        full_ydmax = d3.max(full_lp, function (d) {return d.likelihood;});
        full_ydmin = min_y_for_scaling;
    }
    var ss_alp = crop_to_points_in_ci(ss_lp, ss_ydmax, 1.92);
    var full_alp = crop_to_points_in_ci(full_lp, full_ydmax, 1.92);
    like_y.domain([full_ydmin, full_ydmax]);
    ln_like_linear_scale_y.domain([full_ydmin, full_ydmax]);
    ss_like_y.domain([ss_ydmin, ss_ydmax]);
    ss_ln_like_linear_scale_y.domain([ss_ydmin, ss_ydmax]);

    var transition_time = 400;
    var moving = like_svg.transition();
    moving.select(".ssline")
        .duration(transition_time)
        .attr("d", ss_line_func(ss_lp));
    moving.select(".ssarea")
        .duration(transition_time)
        .attr("d", ss_shading_func(ss_alp));
    moving.select(".ssy.axis")
        .duration(transition_time)
        .call(ss_like_y_axis);
    moving.select(".line")
        .duration(transition_time)
        .attr("d", line_func(full_lp));
    moving.select(".area")
        .duration(transition_time)
        .attr("d", shading_func(full_alp));
    moving.select(".y.axis")
        .duration(transition_time)
        .call(like_y_axis);
};
var like_points = create_like_plot_points([{"nd":0, "ns":0, "n":0}]);
var darr = like_line_f(like_points[0]);
var darea_arr = shading_func(like_points[0]);
var ss_darr = ss_like_line_f(like_points[1]);
var ss_darea_arr = ss_shading_func(like_points[1]);
like_svg.append("path")
       .data(like_points[0])
       .attr("class", "area")
       .attr("d", darea_arr);
like_svg.append("path")
       .data(like_points[1])
       .attr("class", "ssarea")
       .attr("d", ss_darea_arr);

like_svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("class", "line")
    .attr("d", darr);
like_svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("class", "ssline")
    .attr("d", ss_darr);
like_svg.append("g").call(like_x_axis);
like_svg.append("g")
    .attr("class", "y axis")
    .call(like_y_axis);
like_svg.append("g")
    .attr("class", "ssy axis")
    .call(ss_like_y_axis);

like_svg.append("text")
      .attr("transform",
            "translate(" + (like_width/2) + " ," +
                           (xapos + 25) + ")")
      .style("text-anchor", "middle")
      .style("font-style", "italic")
      .text("s");
