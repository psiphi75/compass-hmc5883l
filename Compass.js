
var HMC5883L_ADDRESS = 0x1E;
var MODE_REGISTER = 0x02;
var MEASUREMENT_CONTINUOUS = 0x00;
// var MEASUREMENT_SINGLE_SHOT = 0x01;
// var MEASUREMENT_IDLE = 0x03;


function twos_comp(val, bits) {
    if ((val & (1 << (bits - 1))) !== 0 ){
        val = val - (1 << bits);
    }
    return val;
}


/**
 * Initalise the compass.
 * @param {number}   i2cBusNum The i2c bus number.
 */
function Compass(i2cBusNum) {

    if (typeof i2cBusNum !== 'number') {
        throw new Error('Compass: i2cBusNum must be a number.');
    }

    this.i2c = require('i2c-bus').openSync(i2cBusNum);

}

/**
 * Get the raw (unscaled) values from the compass.
 * @param  {Function} callback The standard callback -> (err, {x:number, y:number, z:number})
 */
Compass.prototype.getRawValues = function (callback) {
    var BUF_LEN = 12;
    var buf = new Buffer(BUF_LEN);
    var self = this;
    this.i2c.writeByte(HMC5883L_ADDRESS, MODE_REGISTER, MEASUREMENT_CONTINUOUS, function (err) {
        if (err) {
            callback(err);
            return;
        }
        self.i2c.readI2cBlock(HMC5883L_ADDRESS, MEASUREMENT_CONTINUOUS, BUF_LEN, buf, function (err2) {
            if (err2) {
                callback(err2);
                return;
            }

            callback(null, {
                x: twos_comp(buf[3] * 256 + buf[4], 16),
                y: twos_comp(buf[7] * 256 + buf[8], 16),
                z: twos_comp(buf[5] * 256 + buf[6], 16)
            });
        });
    });

};


/**
 * Get the heading in radians, where heading is along axis1 and heading is between
 * 0 and 2 * PI.
 * @param  {Function} callback Standard callback
 * @param  {string} axis1 The first axis (determines North)
 * @param  {string} axis2 The second axis (determines West)
 */
Compass.prototype.getHeading = function (axis1, axis2, callback) {

    this.getRawValues(function(err, values) {
        if (err) {
            callback(err);
            return;
        }
        var VALID_AXIS = ['x', 'y', 'z'];
        if (VALID_AXIS.indexOf(axis1) < 0 || VALID_AXIS.indexOf(axis2) < 0 || axis1 === axis2) {
            throw new Error('Compass.getHeading(): At least of the supplied axis are not valid, they must be different and one of :', VALID_AXIS);
        }

        var heading = Math.atan2(values[axis2], values[axis1]);
        if (heading < 0) {
            heading += 2 * Math.PI;
        }
        if (heading > 2 * Math.PI) {
            heading -= 2 * Math.PI;
        }

        callback(null, heading);
    });
};

module.exports = Compass;