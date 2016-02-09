# compass-hmc5883l

This is a library to run the Honeywell HMC5883L 3-axis digital compass IC via the i2c bus.  It has tested on the BeagleBone Series, but it should also work for the Raspberry Pi.

Install:

```bash
npm install compass-hmc5883l
```

Using it:

```javascript
var HMC5883L = require('compass-hmc5883l');

// Connect with the compass on i2c bus number 2
var compass = new HMC5883L(2);

// Get the compass values between x and y.  heading is returned in radians.
compass.getHeading('x', 'y', function (err, heading) {
    console.log(heading * 180 / Math.PI);
});
```

## Further reading

- [The documentation](https://www.adafruit.com/datasheets/HMC5883L_3-Axis_Digital_Compass_IC.pdf).
- [The equivalent Python code](http://www.farnell.com/datasheets/1670762.pdf) for which this library is based on.

## To Do (to reach version 1.0):

- Make use of all the functionality of the code (e.g. enable the mode register on the chip).

## License

Copyright 2016 Simon M. Werner

Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License.
