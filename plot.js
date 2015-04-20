/**
 * Created by Paweł Krawczyk on 20/03/15.
 * https://ipsec.pl/
 */

"use strict";

function go() {
    // framebuster
    if (self == top) {
        console.log('main view enabled');
        document.documentElement.style.display = 'block';
    } else {
        console.warn('frames detected');
        top.location = self.location;
    }

    window['sjcl']['random']['startCollectors']();
    window['nr'] = new NistRandom;

    histogram('sjcl-hist', 'sjcl', 'sjcl-hist-n');
    histogram('math-hist', 'math', 'math-hist-n');
    plot('sjcl-plot', 'sjcl', 'sjcl-plot-n');
    plot('math-plot', 'math', 'math-plot-n');

}

/**
 * Plot a histogram of PRNG output.
 */
function histogram(where, how, n) {
    var e = document.getElementById(where);
    var c = e.getContext('2d');
    var cw = e.width - 1;
    var ch = e.height - 1; // no need for full height

    // histogram bucket width is 10, represented by a single pixel
    var bucket_width = 10;
    // PRNG is sampled cw*ch times
    var num_points = cw * ch;

    // initialize buckets
    var buckets = Array(cw);
    for (var i = 0; i < cw; i++) {
        buckets[i] = 0; // by default it's undefined

    }

    var output;
    // toss the numbers into buckets
    for (i = 0; i < num_points; i++) {

        if (how == 'math') {
            output = Math.floor(Math.random() * cw * bucket_width);
        } else {
            output = nr.getRange(cw * bucket_width);

        }

        // score the value from PRNG
        buckets[Math.floor(output / bucket_width)] += 1;
    }

    c.strokeStyle = '#555';

    // plot the bucket
    for (i = 0; i < cw; i++) {
        c.moveTo(i, ch);
        var bar_h = ch - Math.floor(buckets[i] / 2); // downscale by factor of 2
        c.lineTo(i, bar_h);
    }

    c.stroke();

    document.getElementById(n).textContent = num_points.toString();

}

/**
 * Plot bitmap representation of random number generator output.
 */

function plot(where, how, n) {
    var e = document.getElementById(where);
    var c = e.getContext('2d');
    var w = e.width;
    var h = e.height;
    var img = c.createImageData(w, h);

    var num_points = w * h * 4;

    var pixel;
    for (var i = 0; i < num_points; i++) {

        if (how == 'math') {
            pixel = Math.floor(Math.random() * num_points);
        } else {
            pixel = nr.getRange(num_points);

        }

        img.data[pixel + 0] = 0; // R
        img.data[pixel + 1] = 0; // G
        img.data[pixel + 2] = 0; // B
        img.data[pixel + 3] = 255; // Alpha
    }

    c.putImageData(img, 0, 0);

    document.getElementById(n).textContent = num_points.toString();
}

// actually start the application
// event handler is used to avoid CSP complaints about inline event handlers
document.addEventListener('DOMContentLoaded', function () {
  go();
});