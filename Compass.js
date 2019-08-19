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
 * Technical documentation: https://www.adafruit.com/datasheets/HMC5883L_3-Axis_Digital_Compass_IC.pdf
 * Based on code from: https://github.com/rm-hull/hmc5883l/blob/master/hmc5883l.py
 */

var HMC5883L_ADDRESS = 0x1E;
var HMC5883L_READ_BLOCK = 0x00;

// Configuration Register A: See pp12 of the technical documentation.
var HMC5883L_CONFIG_A_REGISTER = 0x00;
var DEFAULT_CFG_A_MA = 0x03;        // MA1 to MA0 - 8 samples on average
var DEFAULT_SAMPLE_RATE = '15';
var DEFAULT_CALIBRATION = {
    offset: {
        x: 0,
        y: 0,
        z: 0
    },
    scale: {
        x: 1,
        y: 1,
        z: 1
    }
};

var sampleRateMap = {
    '0.75': 0,
    '1.5': 1,
    '3': 2,
    '7.5': 3,
    '15': 4,    /* Default value */
    '30': 5,
    '75': 6
};

// Configuration Register B: See pp13 of the technical documentation.
var HMC5883L_SCALE_REGISTER = 0x01;
var DEFAULT_SCALE = '0.88';
var scaleMap = {
    '0.88': {reg: 0, scalar: 0.73}, /* Default value */
    '1.3': {reg: 1, scalar: 0.92},
    '1.9': {reg: 2, scalar: 1.22},
    '2.5': {reg: 3, scalar: 1.52},
    '4.0': {reg: 4, scalar: 2.27},
    '4.7': {reg: 5, scalar: 2.56},
    '5.6': {reg: 6, scalar: 3.03},
    '8.1': {reg: 7, scalar: 4.35}
};

var HMC5883L_MODE_REGISTER = 0x02;
var HMC5883L_MODE_MEASURE_CONTINUOUS = 0x00;
// var HMC5883L_MODE_MEASUREMENT_SINGLE_SHOT = 0x01;
// var HMC5883L_MODE_MEASUREMENT_IDLE = 0x03;


function twos_complement(val, bits) {
    if ((val & (1 << (bits - 1))) !== 0 ){
        val = val - (1 << bits);
    }
    return val;
}


/**
 * Initalise the compass.
 * @param {number}   i2cBusNum The i2c bus number.
 * @param {object}  options   The additional options.
 *
 * Options:
 *   i2c: the i2c library (such that we don't have to load it twice).
 *   scale (string): The scale range to use.  See pp13 of the technical documentation.  Default is '0.88'.
 *   sampleRate (string): The sample rate (Hz), must be one of .  Default is '15' Hz (samples per second).
 *   declination (number): The declination, in degrees.  If this is provided the result will be true north, as opposed to magnetic north.
 */
function Compass(i2cBusNum, options) {

    if (typeof i2cBusNum !== 'number') {
        throw new Error('Compass: i2cBusNum must be a number.');
    }

    if (!options) {
        options = {};
    }
    this.i2c = (options.i2c || require('i2c-bus')).openSync(i2cBusNum);

    // Set up the scale setting
    this.scale = scaleMap[options.scale || DEFAULT_SCALE];
    if (!this.scale) {
        throw new Error('Compass: scale incorrect defined in options: ', options.scale);
    }

    // Set up the config_A_value
    var sampleRate = sampleRateMap[options.sampleRate || DEFAULT_SAMPLE_RATE];
    if (!sampleRate) {
        throw new Error('Compass: scale incorrect defined in options: ', options.sampleRate);
    }
    var config_A_value = (DEFAULT_CFG_A_MA << 5) | (sampleRate << 2);

    // Set calibration
    this.cal = options.calibration || DEFAULT_CALIBRATION;

    // Now we can init the HMC5883L module.
    try {
        this.i2c.writeByteSync(HMC5883L_ADDRESS, HMC5883L_CONFIG_A_REGISTER, config_A_value);
        this.i2c.writeByteSync(HMC5883L_ADDRESS, HMC5883L_SCALE_REGISTER, this.scale.reg << 5);
        this.i2c.writeByteSync(HMC5883L_ADDRESS, HMC5883L_MODE_REGISTER, HMC5883L_MODE_MEASURE_CONTINUOUS);
    } catch (ex) {
        console.error('Compass(): there was an error initialising: ', ex);
    }

    // Set up declination, default to zero.
    if (!options.declination) {
        options.declination = 0;
    }
    this.declination = options.declination / 180 * Math.PI;

}

/**
 * Get the scaled and calibrated values from the compass.
 * @param  {Function} callback The standard callback -> (err, {x:number, y:number, z:number})
 */
Compass.prototype.getRawValues = function (callback) {
    var BUF_LEN = 12;
    var buf = new Buffer(BUF_LEN);
    var self = this;

    try {
        self.i2c.readI2cBlock(HMC5883L_ADDRESS, HMC5883L_READ_BLOCK, BUF_LEN, buf, i2cCallback);
    } catch (ex) {
        console.error('ERROR: Compass.getRawValues(): error with i2c.writeByte() or i2c.readI2cBlock: ', ex);
        if (callback) {
            callback(ex);
        }
        callback = null;
    }

    function i2cCallback (err) {

        if (err) {
            if (callback) {
                callback(err);
            }
        } else {
            callback(null, {
                x: (convert(3) + self.cal.offset.x) * self.cal.scale.x,
                y: (convert(7) + self.cal.offset.y) * self.cal.scale.y,
                z: (convert(5) + self.cal.offset.z) * self.cal.scale.z
            });
        }
        callback = null;
    }

    function convert(offset) {
        var val = twos_complement(buf[offset] << 8 | buf[offset + 1], 16);
        if (val === -4096) {
            return null;
        }
        return val * self.scale.scalar;
    }
};


/**
 * Get the heading in radians, where heading is along axis1 and heading is between
 * 0 and 2 * PI.
 * @param  {Function} callback Standard callback
 * @param  {string} axis1 The first axis (determines North)
 * @param  {string} axis2 The second axis (determines West)
 */
Compass.prototype.getHeading = function (axis1, axis2, callback) {

    var self = this;
    this.getRawValues(function(err, vector) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, self.calcHeading(axis1, axis2, vector));
    });
};


/**
 * Calculate the heading in radians, where heading is along axis1 and heading is between
 * 0 and 2 * PI.
 * @param {string} axis1 The first axis (determines North)
 * @param {string} axis2 The second axis (determines West)
 * @param {object} vector the {x, y, z} vector
 * @return the heading in radians
 */
Compass.prototype.calcHeading = function calcHeading(axis1, axis2, vector) {

    var VALID_AXIS = ['x', 'y', 'z'];
    if (VALID_AXIS.indexOf(axis1) < 0 || VALID_AXIS.indexOf(axis2) < 0 || axis1 === axis2) {
        throw new Error('Compass.getHeading(): At least of the supplied axis are not valid, they must be different and one of :', VALID_AXIS);
    }

    var twoPies = 2 * Math.PI;
    var heading = Math.atan2(vector[axis2], vector[axis1]);
    heading += this.declination;

    while (heading < 0) {
        heading += twoPies;
    }
    while (heading > twoPies) {
        heading -= twoPies;
    }

    return heading;
};

Compass.prototype.calcHeadingDegrees = function calcHeading(axis1, axis2, vector) {
    return this.calcHeading(axis1, axis2, vector) * 180 / Math.PI;
};


/**
 * Get the heading in decimal degrees, where heading is along axis1 and heading
 * is between 0 and 360 degrees.
 * @param  {Function} callback Standard callback
 * @param  {string} axis1 The first axis (determines North)
 * @param  {string} axis2 The second axis (determines West)
 */
Compass.prototype.getHeadingDegrees = function (axis1, axis2, callback) {

    this.getHeading(axis1, axis2, function (err, heading) {
        if (err) {
            callback(err, heading);
        } else {
            callback(null, heading * 180 / Math.PI);
        }
    });
};


/**
 * Set the magnetic declination, in degrees.
 * 
 * @param  {number} declination The magnetic declination in degrees.
 */
Compass.prototype.setDeclination = function (declination) {
    this.declination = declination / 180 * Math.PI;
};

module.exports = Compass;
