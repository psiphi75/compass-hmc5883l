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

var Compass = require('compass-hmc5883l');
var compass = new Compass(1);

// Gets called every time we get the values.
function printHeadingCB(err, heading) {
    if (err) {
        console.log(err);
        return;
    }
    console.log(heading * 180 / Math.PI);
}

// Get the compass values every 100 milliseconds
setInterval(function() {
    compass.getHeading('x', 'y', printHeadingCB);
}, 100);


//
// var Compass = require('compass-hmc5883l');
// var compass = new Compass(2);
//
// // Get the compass values
// compass.getHeading('x', 'y', function (err, heading) {
//     console.log(heading * 180 / Math.PI);
// });
//
