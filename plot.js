/**
 * Created by Paweł Krawczyk on 20/03/15.
 * https://ipsec.pl/
 */

"use strict";

function plot() {
    sjcl.random.startCollectors();

    var e = document.getElementById('math');
    var c = e.getContext('2d');
    var w = e.width;
    var h = e.height;
    var img = c.createImageData(w, h);

    var num_points = w * h * 4;

    for (var i = 0; i < num_points; i++) {
        var pixel = Math.floor(Math.random() * num_points);

        img.data[pixel + 0] = 0; // R
        img.data[pixel + 1] = 0; // G
        img.data[pixel + 2] = 0; // B
        img.data[pixel + 3] = 255; // Alpha
    }

    c.putImageData(img, 0, 0);

    e = document.getElementById('sjcl');
    c = e.getContext('2d');
    img = c.createImageData(w, h);
    var nr = new NistRandom;

    for (i = 0; i < num_points; i++) {
        pixel = nr.getRange(num_points);
        img.data[pixel + 0] = 0; // R
        img.data[pixel + 1] = 0; // G
        img.data[pixel + 2] = 0; // B
        img.data[pixel + 3] = 255; // Alpha
    }

    c.putImageData(img, 0, 0);

}