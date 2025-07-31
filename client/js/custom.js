"use strict";
$('.more-menu').hide();
var affectsArousal = document.getElementById("affects_arousal");
noUiSlider.create(affectsArousal, {
  range: {
    min: [-1],
    "50%": [0, 0],
    max: [1],
  },
  start: 0,
  orientation: "vertical",
  direction: "rtl",
  pips: {
    mode: "steps",
    density: 3,
  },
});

var affectsValence = document.getElementById("affects_valence");
noUiSlider.create(affectsValence, {
  range: {
    min: [-1],
    "50%": [0, 0],
    max: [1],
  },
  start: 0,
  orientation: "vertical",
  direction: "rtl",
  pips: {
    mode: "steps",
    density: 3,
  },
});

var likelyAge = document.getElementById("likely_age");
noUiSlider.create(likelyAge, {
  range: {
    min: [0],
    "20%": [20, 20],
    "40%": [40, 40],
    "60%": [60, 60],
    "80%": [80, 80],
    max: [100],
  },
  start: 0,
  orientation: "vertical",
  direction: "rtl",
  pips: {
    mode: "steps",
    density: 3,
  },
});

//likelyAge.noUiSlider.set(80);
//slider.setAttribute("disabled", true);
/*---------3 dots-------*/
// var el = document.querySelector(".more");
// var btn = el.querySelector(".more-btn");
// var menu = el.querySelector(".more-menu");
// var visible = false;
 
// function showMenu(e) {
//   $('.more-menu').show();
// }
 
// function hideMenu(e) {
//   $('.more-menu').hide();
// }
// btn.addEventListener("click", showMenu, false);
