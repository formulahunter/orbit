

class Angle {

    private _rad: number | null = null;
    private _deg: number | null = null;

    constructor();
    constructor(radians: number, isDegrees?: false);
    constructor(degrees: number, isDegrees: true);
    constructor(val: number = 0, isDegrees: boolean = false) {

        if(isDegrees) {
            this.d = val;
        }
        else {
            this.r = val;
        }
    }

    /** get this angle's value in radians */
    get r(): number {

        if(this._rad === null) {

            //  if degrees is also null then this angle is indeterminate
            if(this._deg === null) {
                console.debug('cannot access r on indeterminate Angle %o', this);
                throw new TypeError('indeterminate angle');
            }

            //  find radians as degrees multiplied by the radio of radians per
            //  degree
            this._rad = Math.PI * this._deg / 180;
        }

        return this._rad;
    }
    /** set this angle's value in radians */
    set r(radians: number) {

        this._rad = radians;

        //  invalidate existing degrees value but don't recalculate at this time
        this._deg = null;
    }

    /** get this angle's value in degrees */
    get d(): number {

        if(this._deg === null) {

            //  if radians is also null then this angle is indeterminate
            if(this._rad === null) {
                console.debug('cannot access d on indeterminate Angle %o', this);
                throw new TypeError('indeterminate angle');
            }

            //  find degrees as radians multiplied by the radio of degrees per
            //  radian
            this._deg = 180 * this._rad / Math.PI;
        }

        return this._deg;
    }
    /** set this angle's value in degrees */
    set d(degrees: number) {

        this._deg = degrees;

        //  invalidate existing radians value but don't recalculate at this time
        this._rad = null;
    }

    /** get the value of this angle in radians */
    valueOf() {
        return this.r;
    }

    /** coerce this angle to a number (by default) or a string (if the hint
     * argument is 'string') */
    [Symbol.toPrimitive](hint: string): number | string {

        if(hint === 'string') {
            return this.r.toString();
        }

        return this.r;
    }
}


export default Angle;
