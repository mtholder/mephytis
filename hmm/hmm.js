var g_bead_draws = [];
var g_bin_draws = [];
var draw_text = "RY";
var draw_color = ["orange", "darkgreen"];
var draw_text_color = ["black", "white"];
var num_urns = 2;

var num_samples_per_click = 1;
var g_s_hat = '?';
var using_ln_scale = true;

var s_chooser, c_chooser;
var g_true_s, g_true_c;
var s_domain_str = ["0.25", "0.5", "0.75"];
var s_domain = [0.25, 0.5, 0.75];
var c_domain_str = ["1", "2", "3", "4"];
var c_domain = [1, 2, 3, 4];
var bead_color_btn_arr = [[null, null, null, null], [null, null, null, null]];
var bead_color_rand_btn_arr = [[null, null, null, null], [null, null, null, null]];
var lock_icon_arr = [null, null, null, null];
var bead_colors = [[0,0,0,0],[1,1,1,1]];
var bead_col_is_mutable = [true, true, true, true];
var num_immutable_beads = 4;
var num_mutable = 4;
var g_n0in0=8, g_n1in0=0, g_n0in1=0, g_n1in1=8;

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

var manual_entry = function(urn_or_bead, val) {
    var classname, container, new_el, styling;
    if (urn_or_bead == 0) {
        container = document.getElementById("manualurns");
        if (val == 0 || val == 1) {
            new_el = document. createElement("button");
            classname = "btnManualUrn";
            if (val == 0) {
                styling = "background-color: #ffa500;color: #000000";
            } else {
                styling = "background-color: #006400;color: #FFFFFF";
            }
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
};
var changed_s = function() {
    g_true_s = + s_chooser.value;
    console.log("g_true_s =" + g_true_s);
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
};

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
    changed_c();
    changed_s();
    changed_beads();
}); // document.ready()
