var g_bead_draws = [];
var g_urn_draws = [];
var draw_text = "RY";
var draw_color = ["orange", "darkgreen"];
var draw_text_color = ["black", "white"];
var num_urns = 2;

var num_samples_per_click = 1;
var g_s_hat = '?';
var using_ln_scale = true;

var s_chooser, c_chooser;
var g_true_s, g_true_c;
var g_switch_prob = 0.5;
var s_domain_str = ["0.25", "0.5", "0.75"];
var s_domain = [0.25, 0.5, 0.75];
var c_domain_str = ["1", "2", "3", "4"];
var c_domain = [1, 2, 3, 4];
var bead_color_btn_arr = [[null, null, null, null], [null, null, null, null]];
var bead_color_rand_btn_arr = [[null, null, null, null], [null, null, null, null]];
var lock_icon_arr = [null, null, null, null];
var bead_colors = [[0,0,0,0],[1,1,1,1]];
var g_prob_zero = [1.0, 0.0];
var bead_col_is_mutable = [true, true, true, true];
var num_immutable_beads = 4;
var num_mutable = 4;
var num_beads_per_urn = num_immutable_beads + num_mutable;
var g_n0in0=8, g_n1in0=0, g_n0in1=0, g_n1in1=8;
var g_curr_urn = Math.floor(Math.random()*2);

var changed_c = function() {
    g_true_c = parseInt(c_chooser.value);
    console.log("g_true_c =" + g_true_c);
    var i;
    for (i = 0; i < 4; ++i) {
        if (i + 1 > g_true_c) {
            set_bead_activity(i, false);
        } else {
            set_bead_activity(i, true);
        }
    }

    clear_data();
};

var clear_data = function() {
    g_bead_draws = [];
    g_urn_draws = [];
    update_data_boxes(g_bead_draws);
};

var update_data_boxes = function (data) {
    d3.select("#samplesize").text(data.length);
    var drawboxes = d3.select(".drawcont")
            .selectAll("button")
            .data(data);
    drawboxes.enter()
        .append("button")
        .attr("class", function(d) {return "button" + d;})
        .style("width", "10pt");
    drawboxes.exit()
        .remove();
};

var set_bead_activity = function(index, val) {
    if (bead_col_is_mutable[index] == val) {
        return;
    }
    bead_col_is_mutable[index] = val;
    if (val) {
        bead_color_rand_btn_arr[0][index].style.display = "inline";
        bead_color_rand_btn_arr[1][index].style.display = "inline";
        bead_color_btn_arr[0][index].disabled = false;
        bead_color_btn_arr[1][index].disabled = false;
        lock_icon_arr[index].style.display = "none";
    } else {
        set_bead_color(0, index, 0);
        set_bead_color(1, index, 1);
        bead_color_rand_btn_arr[0][index].style.display = "none";
        bead_color_rand_btn_arr[1][index].style.display = "none";
        bead_color_btn_arr[0][index].disabled = true;
        bead_color_btn_arr[1][index].disabled = true;
        lock_icon_arr[index].style.display = "inline";
    }
};

var process_starting = function() {
    var starting_urns = document.getElementById("manualurns").childNodes;
    var starting_beads = document.getElementById("manualbeads").childNodes;
    if (starting_urns.length !== starting_beads.length) {
        d3.select("#errormessage").text("The # of starting urns has to equal the # of starting beads!");
        return;
    }
    d3.select("#errormessage").text("");
    clear_data();
    var i, curr_, urnclass_name;
    for (i = 0; i < starting_urns.length; ++i) {
        curr_ = starting_urns[i];
        urnclass_name = curr_.getAttribute("class");
        if (urnclass_name[urnclass_name.length - 1] == "0") {
            g_urn_draws.push(0);
        } else {
            g_urn_draws.push(1);
        }
    }
    for (i = 0; i < starting_beads.length; ++i) {
        curr_ = starting_beads[i];
        urnclass_name = curr_.getAttribute("class");
        if (urnclass_name[urnclass_name.length - 1] == "0") {
            g_bead_draws.push(0);
        } else {
            g_bead_draws.push(1);
        }
    }
    update_data_boxes(g_bead_draws);
};

var manual_entry = function(urn_or_bead, val) {
    var classname, container, new_el, styling;
    if (urn_or_bead == 0) {
        container = document.getElementById("manualurns");
        if (val == 0 || val == 1) {
            new_el = document. createElement("button");
            classname = "btnManualUrn" + val;
            new_el.setAttribute("class", classname);
            new_el.setAttribute("style", styling);
            new_el.textContent = "⚱";
        }
    } else {
        container = document.getElementById("manualbeads");
        if (val == 0 || val == 1) {
            new_el = document. createElement("button");
            classname = "button" + val;
            new_el.setAttribute("class", classname);
        }
    }
    if (val == -1) {
        if (container.childNodes.length > 0) {
            container.removeChild(container.lastElementChild);
        }
    } else {
        container.appendChild(new_el);
    }

    clear_data();
};
var changed_s = function() {
    g_true_s = + s_chooser.value;
    g_switch_prob = 0.5*g_true_s;
    clear_data();
};

var randomize_s = function() {
    s_chooser.value = s_domain_str[Math.floor(Math.random()*s_domain_str.length)];
    changed_s();
};

var randomize_c = function() {
    c_chooser.value = c_domain_str[Math.floor(Math.random()*c_domain_str.length)];
    changed_c();
};

var toggle_bead = function(urn, bead) {
    set_bead_color(urn, bead, 1 - bead_colors[urn][bead]);
};

// from https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var rand_urn = function(urn) {
    var i;
    for (i = 0; i < g_true_c; ++i) {
        rand_bead(urn, i);
    }
};
var rand_bead = async function(urn, bead) {
    var sel_bead = bead_color_btn_arr[urn][bead];
    sel_bead.style.display = "none";
    await sleep(200);
    var bval;
    if (Math.random() < 0.5) {
        bval = 0;
    } else {
        bval = 1;
    }
    set_bead_color(urn, bead, bval);
    sel_bead.style.display = "inline";
    clear_data();
};

var set_bead_color = function(urn, bead, bval) {
    var sel_bead = bead_color_btn_arr[urn][bead];
    bead_colors[urn][bead] = bval;
    var newclassname = "button" + bval;
    sel_bead.className = newclassname;
    changed_beads();
};

var changed_beads = function() {
    var urn0 = bead_colors[0]
    var num_1_in_0 = urn0[0] + urn0[1] + urn0[2] + urn0[3] ;
    var urn1 = bead_colors[1]
    var num_1_in_1 = urn1[0] + urn1[1] + urn1[2] + urn1[3] ;
    g_n0in0 = num_immutable_beads + num_mutable - num_1_in_0;
    g_n1in0 = num_1_in_0;
    g_n0in1 = num_mutable - num_1_in_1;
    g_n1in1 = num_immutable_beads + num_1_in_1;
    d3.select("#num0in0").text(g_n0in0);
    d3.select("#num1in0").text(g_n1in0);
    d3.select("#num0in1").text(g_n0in1);
    d3.select("#num1in1").text(g_n1in1);
    g_prob_zero[0] = g_n0in0/num_beads_per_urn;
    g_prob_zero[1] = g_n0in1/num_beads_per_urn;
    clear_data();
};

var draw_random_urn_index = function () {
    return Math.floor(Math.random() * num_urns);
};


var draw_next_bead = function(sprob) {
    console.log("sprob = " + sprob);
    var missing_prob, i;
    for (i = 0; i < num_samples_per_click; ++i) {
        var next_ind = g_bead_draws.length;
        if (next_ind == 0) {
            g_urn_draws[0] = draw_random_urn_index();
        } else {
            var curr_ind = g_urn_draws[g_urn_draws.length - 1];
            var new_ind = curr_ind;
            if (Math.random() < sprob) {
                new_ind = 1 - curr_ind;
            }
            g_urn_draws[next_ind] = new_ind;
        }
        var prob0 = g_prob_zero[g_urn_draws[next_ind]];
        if (Math.random() < prob0) {
            g_bead_draws[next_ind] = 0;
        } else {
            g_bead_draws[next_ind] = 1;
        }
    }
    update_data_boxes(g_bead_draws);
    update_inference(g_bead_draws);
};

var update_inference = function(data) {
//    var sum_stats = update_summary_stats(data);
//    update_likelihood_plots(sum_stats);
};
var g_num_obs_svg, slider_num_obs;

$(document).ready(function() {
    c_chooser = document.getElementById("choose-contamination");
    s_chooser= document.getElementById("choose-switch");
    var i, j;
    for (i = 0; i < 2; ++i) {
        for (j = 0; j < 4; ++j) {
            bead_color_btn_arr[i][j] = document.getElementById("btnu" + i + "b" + j);
            bead_color_rand_btn_arr[i][j] = document.getElementById("randbtn" + i + "b" + j);
            if (i == 0) {
                lock_icon_arr[j] = document.getElementById("locks"  + j);
            }
        }
    }
    slider_num_obs = d3.sliderBottom()
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
    g_num_obs_svg = d3.select('span#num-obs-slider')
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
    d3.select(".simbtn")
        .attr("onclick", "draw_next_bead(g_switch_prob)");
    changed_c();
    changed_s();
    changed_beads();
}); // document.ready()
