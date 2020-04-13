/** Vector class
 *
 * This class represents a geospatial offset or, more generally, some value with
 * both a direction and magnitude (e.g. angular momentum). Component values are
 * calculated on demand, then cached for subsequent access.
 */
import Angle from './Angle.js';

interface Cartesian3D {
    x: number,
    y: number,
    z: number
}

interface Spherical3D {
    theta: number | Angle,
    phi: number | Angle,
    r: number
}

class Vector implements Cartesian3D, Spherical3D {

    private _x: number | null = null;
    private _y: number | null = null;
    private _z: number | null = null;

    /** angle (in radians) from the positive x axis to the point's projection
     * onto the x-y (horizontal) plane, measured about the origin */
    private _theta: Angle | null = null;

    /** angle (in radians) from the x-y (horizontal) plane point, measured about
     * the origin */
    private _phi: Angle | null = null;

    /** the distance from the origin to the point (always positive) */
    private _r: number | null = null;

    /** construct a Vector instance with default component values {0, 0, 0} or
     * in terms of given components and coordinate system type */
    constructor();
    constructor(x: number, y: number, z: number, isSpherical?: false);
    constructor(theta: Angle | number, phi: Angle | number, r: number, isSpherical: true);
    constructor(c1: number | Angle = 0, c2: number | Angle = 0, c3: number = 0, isSpherical: boolean = false) {

        if(isSpherical) {

            if(typeof c1 === 'number') {
                c1 = new Angle(c1);
            }
            if(typeof c2 === 'number') {
                c2 = new Angle(c2);
            }

            this.theta = c1;
            this.phi = c2;
            this.r = c3;
        }
        else {

            if(c1 instanceof Angle) {
                console.debug(`angle %o passed as cartesian component x to vector constructor`, c1);
                throw new TypeError('invalid vector constructor argument');
            }
            if(c2 instanceof Angle) {
                console.debug(`angle %o passed as cartesian component y to vector constructor`, c2);
                throw new TypeError('invalid vector constructor argument');
            }

            this.x = c1;
            this.y = c2;
            this.z = c3;
        }
    }

    static copy(v: Vector[]): Vector[];
    static copy(v: Vector): Vector;
    static copy(v: Vector | Vector[]): Vector[] | Vector {
        if(Array.isArray(v)) {
            return v.map(Vector.copy);
        }
        return new Vector(...v.valueOf());
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
            this._x = this._r * Math.cos(this._phi.r) * Math.cos(this._theta.r);
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
            this._y = this._r * Math.cos(this._phi.r) * Math.sin(this._theta.r);
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
            this._z = this._r * Math.sin(this._phi.r);
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
    get theta(): Angle {

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
            this._theta = new Angle(Math.atan2(this._y, this._x));
        }

        return this._theta;
    }
    /** set the angle from the positive x axis to this point's image on the x-y
     * (horizontal) plane, as measured about the origin */
    set theta(theta: Angle) {

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
    get phi(): Angle {

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
            this._phi = new Angle(Math.atan2(this._z, lateral));
        }

        return this._phi;
    }
    /** set the angle from the x-y (horizontal) plane to this point, as measured
     *  about the origin */
    set phi(phi: Angle) {

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

    /** get this vector's Cartesian components in homogeneous coordinates for
     * use in calculations
     *
     * if needed, this result could be cached for performance relief
     */
    get homogeneous(): number[] {
        return [this.x, this.y, this.z, 1];
    }

    /** get this vector's "magnitude" as the RSS of its components */
    get magnitude(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    /** get a new vector with components equal to this vector's components
     * multiplied by the given factor(s) */
    scale(s: number | [number, number, number]): Vector {

        if(Array.isArray(s)) {
            return new Vector(this.x * s[0], this.y * s[1], this.z * s[2]);
        }
        return new Vector(this.x * s, this.y * s, this.z * s);
    }

    /** get a new vector with components equal to the sum of this
     *  vector's components and those of the given vector */
    add(v: Vector): Vector {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    /** get a new vector with components equal to this vector's components */
    copy() : Vector {
        return new Vector(this.x, this.y, this.z);
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

    /** get this instance's raw value as an array of coordinates */
    valueOf(): [number, number, number] {
        return [this.x, this.y, this.z];
    }
}


export {Cartesian3D, Spherical3D, Vector};
