/** Vector class
 *
 * This class represents a geospatial offset or, more generally, some value with
 * both a direction and magnitude (e.g. angular momentum). Component values are
 * calculated on demand, then cached for subsequent access.
 */

class Vector {

    private _x: number | null = null;
    private _y: number | null = null;
    private _z: number | null = null;

    /** angle (in radians) from the positive x axis to the point's projection
     * onto the x-y (horizontal) plane, measured about the origin */
    private _theta: number | null = null;

    /** angle (in radians) from the x-y (horizontal) plane point, measured about
     * the origin */
    private _phi: number | null = null;

    /** the distance from the origin to the point (always positive) */
    private _r: number | null = null;

    /** construct a Vector instance with default component values {0, 0, 0} or
     * in terms of given components and coordinate system type */
    constructor();
    constructor(x: number, y: number, z: number, isSpherical?: false);
    constructor(theta: number, phi: number, r: number, isSpherical: true);
    constructor(c1: number = 0, c2: number = 0, c3: number = 0, isSpherical: boolean = false) {

        if(isSpherical) {
            this.theta = c1;
            this.phi = c2;
            this.r = c3;
        }
        else {
            this.x = c1;
            this.y = c2;
            this.z = c3;
        }
    }


    /** get this point's position along the x axis */
    get x(): number {

        if(this._x === null) {

            //  x has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid spherical components
            //  (ways to combine one or two with a valid y and/or z may be
            //  considered in the future)
            if(this._theta === null || this._phi === null || this._r === null) {
                console.debug('x is indeterminate due to one or more invalid' +
                    ' spherical components in Vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  x is the cosine component of theta with a hypotenuse equal to
            //  r * cos(phi)
            this._x = this._r * Math.cos(this._phi) * Math.cos(this._theta);
        }

        return this._x;
    }
    /** set this point's position along the x axis */
    set x(x: number) {

        this._x = x;

        //  spherical components are no longer valid
        this._theta = null;
        this._phi = null;
        this._r = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }

    /** get this point's position along the y axis */
    get y(): number {

        if(this._y === null) {

            //  y has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid spherical components
            //  (ways to combine one or two with a valid x and/or z may be
            //  considered in the future)
            if(this._theta === null || this._phi === null || this._r === null) {
                console.debug('y is indeterminate due to one or more invalid' +
                    ' spherical components in Vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  y is the sine component of theta with a hypotenuse equal to
            //  r * cos(phi)
            this._y = this._r * Math.cos(this._phi) * Math.sin(this._theta);
        }

        return this._y;
    }
    /** set this point's position along the y axis */
    set y(y :number) {

        this._y = y;

        //  spherical components are no longer valid
        this._theta = null;
        this._phi = null;
        this._r = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }

    /** get this point's position along the z axis */
    get z(): number {

        if(this._z === null) {

            //  z has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid spherical components
            //  (ways to combine one or two with a valid x and/or y may be
            //  considered in the future)
            if(this._theta === null || this._phi === null || this._r === null) {
                console.debug('z is indeterminate due to one or more invalid' +
                    ' spherical components in Vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  z is the sine component of phi with a hypotenuse equal to r
            this._z = this._r * Math.sin(this._phi);
        }

        return this._z;
    }
    /** set this point's position along the z axis */
    set z(z: number) {

        this._z = z;

        //  spherical components are no longer valid
        this._theta = null;
        this._phi = null;
        this._r = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }


    /** get the angle from the positive x axis to this point's image on the x-y
     * (horizontal) plane, as measured about the origin */
    get theta() {

        if(this._theta === null) {

            //  theta has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid Cartesian components
            //  (ways to combine one or two with a valid phi and/or r may be
            //  considered in the future)
            if(this._x === null || this._y === null || this._z === null) {
                console.debug('theta is indeterminate due to one or more' +
                        ' invalid cartesian components in Vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  theta is the angle from the +x axis to the point's image on the
            //  x-y (horizontal) plane
            this._theta = Math.atan2(this._y, this._x);
        }

        return this._theta;
    }
    /** set the angle from the positive x axis to this point's image on the x-y
     * (horizontal) plane, as measured about the origin */
    set theta(theta: number) {

        this._theta = theta;

        //  Cartesian components are no longer valid
        this._x = null;
        this._y = null;
        this._z = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }

    /** get the angle from the x-y (horizontal) plane to this point, as measured
     *  about the origin */
    get phi(): number {

        if(this._phi === null) {

            //  phi has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid Cartesian components
            //  (ways to combine one or two with a valid theta and/or r may be
            //  considered in the future)
            if(this._x === null || this._y === null || this._z === null) {
                console.debug('phi is indeterminate due to one or more' +
                    ' invalid cartesian components in vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  phi is the angle from the x-y (horizontal) plane to this point
            let lateral = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
            this._phi = Math.atan2(this._z, lateral);
        }

        return this._phi;
    }
    /** set the angle from the x-y (horizontal) plane to this point, as measured
     *  about the origin */
    set phi(phi: number) {

        this._phi = phi;

        //  Cartesian components are no longer valid
        this._x = null;
        this._y = null;
        this._z = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }

    /** get the distance from the origin to this point */
    get r(): number {

        if(this._r === null) {

            //  r has been invalidated by some other operation
            //  recalculate its value based on known (valid) components
            //  for now this will require three valid Cartesian components
            //  (ways to combine one or two with a valid theta and/or phi may be
            //  considered in the future)
            if(this._x === null || this._y === null || this._z === null) {
                console.debug('r is indeterminate due to one or more invalid' +
                    ' cartesian components in vector %o', this);
                throw new TypeError('indeterminate vector component');
            }

            //  r is equal to the root sums squared of the three Cartesian
            //  components
            this._r = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2)
                        + Math.pow(this._z, 2));
        }

        return this._r;
    }
    /** set the distance from the origin to this point */
    set r(r: number) {

        this._r = r;

        //  Cartesian components are no longer valid
        this._x = null;
        this._y = null;
        this._z = null;

        //  homogeneous coords are no longer valid
        // this._hom = null;
    }

    /** get a string representing this instance's "class" and Cartesian
     *  component values */
    toString() {
        return `Vector${this.cartesianString}`;
    }
    /** get this instance's Cartesian components in a formatted string */
    get cartesianString(): string {
        return `{${this.x}, ${this.y}, ${this.z}}`;
    }
    /** get this instance's spherical components in a formatted string */
    get sphericalString(): string {
        return `{${this.theta}, ${this.phi}, ${this.r}}`;
    }

    /** get this instance's raw value as an array of Cartesian coordinates */
    valueOf() {
        return [this.x, this.y, this.z];
    }
}


export default Vector;
