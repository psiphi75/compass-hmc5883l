/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

/**
 * Calibarate the magnometer.
 *
 * Usage:
 *     node Calibrate.js
 *
 * Once the calibration is started you will want to move the sensor around all axes.  What we want is to find the
 * extremes (min/max) of the x, y, z values such that we can find the offset and scale values.
 *
 * The output will be JSON text.  You can use this as input for the mpu9250, as an option.
 *
 * These calibration calculations are based on this page:
 * http://www.camelsoftware.com/2016/03/13/imu-maths-calculate-orientation-pt3/
 */

var SAMPLE_RATE = 30;

// Instantiate and initialize.
var Compass = require('./Compass');
var compass = new Compass(2, {
    sampleRate: SAMPLE_RATE.toString(),
    scale: '0.88',
});

var min = {
    x: Infinity,
    y: Infinity,
    z: Infinity
};
var max = {
    x: -Infinity,
    y: -Infinity,
    z: -Infinity
};
var count = 0;
var MAX_NUM = 1000;

console.log('Rotate the magnometer around all 3 axes, until the min and max values don\'t change anymore.');
console.log('    x        y        z      min x    min y    min z    max x    max y    max z');

setInterval(function () {
    if (count++ > MAX_NUM) {
        wrapUp();
    }

    compass.getRawValues(function (err, vals) {
        if (err) {
            wrapUp(err);
        } else {

            min.x = Math.min(min.x, vals.x);
            min.y = Math.min(min.y, vals.y);
            min.z = Math.min(min.z, vals.z);

            max.x = Math.max(max.x, vals.x);
            max.y = Math.max(max.y, vals.y);
            max.z = Math.max(max.z, vals.z);

            process.stdout.write(p(vals.x) + p(vals.y) + p(vals.z) + p(min.x) + p(min.y) + p(min.z) + p(max.x) + p(max.y) + p(max.z) + '\r');
        }
    });
}, SAMPLE_RATE);

function p(num) {
    var str = num.toFixed(3);
    while (str.length <= 7) {
        str = ' ' + str;
    }
    return str + ' ';
}

var offset = {};
var scale = {};
function calcCalibration() {
    offset = {
        x: (min.x + max.x) / 2,
        y: (min.y + max.y) / 2,
        z: (min.z + max.z) / 2
    };
    var vmax = {
        x: max.x - ((min.x + max.x) / 2),
        y: max.y - ((min.y + max.y) / 2),
        z: max.z - ((min.z + max.z) / 2)
    };
    var vmin = {
        x: min.x - ((min.x + min.x) / 2),
        y: min.y - ((min.y + min.y) / 2),
        z: min.z - ((min.z + min.z) / 2)
    };
    var avg = {
        x: (vmax.x - vmin.x) / 2,
        y: (vmax.y - vmin.y) / 2,
        z: (vmax.z - vmin.z) / 2
    };
    var avg_radius = (avg.x + avg.y + avg.z) / 2;
    scale = {
        x: avg_radius / avg.x,
        y: avg_radius / avg.y,
        z: avg_radius / avg.z
    };
}

function wrapUp(err) {

    if (err) {
        console.error(err);
    } else {
        console.log('\n\nCalibrated values:');
        calcCalibration();
        console.log({
            offset: offset,
            scale: scale
        });
    }

    var exit = process.exit;
    exit(0);
}
