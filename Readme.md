# compass-hmc5883l

This is a library to run the Honeywell HMC5883L 3-axis digital compass IC via the i2c bus.
It has tested on the BeagleBone Series, but it should also work for the Raspberry Pi.

Install:

```sh
npm install compass-hmc5883l
```

Using it:

```JavaScript
var HMC5883L = require('compass-hmc5883l');

// Connect with the HMC5883L compass on i2c bus number 2
var compass = new HMC5883L(2);

// Get the compass values between x and y.  Heading is returned in degrees.
compass.getHeadingDegrees('x', 'y', function (err, heading) {
    console.log(heading);
});

// The following reading will return {x, y, z} values in milli Tesla:
compass.getRawValues(function (err, vals) {
    console.log(vals);
});
```

## Calibration

To get more accurate results out of the magnetometer it needs to be calibrated. The calibration technique used is
described at [CamelSoftware](http://www.camelsoftware.com/2016/03/13/imu-maths-calculate-orientation-pt3/).

To calibrate the magnetometer, run the following:

```sh
node Calibrate.js
```

Then rotate the compass around all directions (figure eights are good). Make sure you get all the min and max values.
The calibrated object is then returned, it looks something like the following:

```JavaScript
{
    offset: {
        x: 22.265,
        y: -97.455,
        z: -37.595
    },
    scale: {
        x: 1.62950,
        y: 1.31346,
        z: 1.60008
    }
}
```

You can then use this to initialise the compass, see the [Options](#Options) section below on how to apply the changes.

## Further reading

- [The documentation](https://www.adafruit.com/datasheets/HMC5883L_3-Axis_Digital_Compass_IC.pdf).
- [The equivalent Python code](https://github.com/rm-hull/hmc5883l) for which this library is partially based on.

## Options

You can initialise the compass with options. Below is an example along with documentation.

```JavaScript
var options = {
    /*
     * Pass the i2c library as an option.  This saves us from loading the
     * library twice.
     */
    i2c: i2c,

    /*
     * The sample rate (Hz), must be one of '0.75', '1.5', '3', '7.5',
     * '15', '30', or '75'.  Default is '15' Hz (samples per second).
     */
    sampleRate: '15', /* default */

    /*
     * The declination, in degrees.  If this is provided the result
     * will be true north, as opposed to magnetic north. See the
     * following link: https://www.npmjs.com/package/geomagnetism
     */
    declination: 19.1621,

    /*
     * The scale range to use.  See pp13 of the technical documentation.
     * Different expected magnetic intensities  require different scales.
     */
    scale: '0.88' /* default */

    /*
     * The calibrated values.  Default offsets are 0.  Default scale values are 1.0.
     */
    calibration: {
        offset: {
            x: 22.265,
            y: -97.455,
            z: -37.595
        },
        scale: {
            x: 1.62950,
            y: 1.31346,
            z: 1.60008
        }
    }
};

var compass = new HMC5883L(2, options);
```

## License

Copyright 2019 Simon M. Werner

Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.
See the NOTICE file distributed with this work for additional information regarding copyright
ownership. The ASF licenses this file to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy of the
License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License
is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing permissions and limitations under the
License.
