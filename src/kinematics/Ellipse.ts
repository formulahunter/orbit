/** Ellipse class
 *
 * This class represents an ellipse defined in the general form as
 *
 *      (x^2)/(a^2) + (y^2)/(b^2) = 1
 *
 * where a >= b. In that case, the ellipse has a major axis (longer of the two)
 * of length 2*a and a minor axis (shorter of the two) of length 2*b. a and
 * be are called the semi-major and semi-minor axes, respectively, using the
 * prefix "semi-" meaning "half".
 *
 * The focal points (pl. foci) of an ellipse have special geometric
 * significance - the sum of their distances from a point on the ellipse is
 * equivalent for all points that lie on the ellipse. Their locations are given
 * by
 *
 *      (x, y) = (+/-c, 0)
 *
 * where c is defined as
 *
 *      c = sqrt(a^2 + b^2)
 *
 * An ellipse is a specific class of conic section for which the eccentricity,
 * e, falls in the range
 *
 *      0 < e < 1
 *
 * exclusive. The eccentricity is defined as
 *
 *      e = c / a = sqrt(1 - (b^2 / a^2))
 *
 * A perfect circle is a special case of an ellipse for which a = b and e = 0.
 *
 * https://en.wikipedia.org/wiki/Ellipse
 */
/** General form coefficients
 * The interface makes a subtle distinction between the coefficients (a &
 * b) and the semi-major and semi-minor axes. The properties a and b will
 * always be left as assigned externally, whereas the semi-major and semi-minor
 * axes will always be the greater and the lesser of the two, respectively. The
 * intent is to provide flexibility in the way the class is used, but it
 * requires that attention be paid to how they are used in order to prevent
 * unexpected results. In particular, see the sMaj & sMin setter methods'
 * doc comments for notes on which of a or b is assigned the new value.
 */
import Vector from './Vector.js';


/** An ellipse in a 2D plane */
class Ellipse {

    /** the ellipse's true (geometric) center, at the intersection of its major
     * and minor axes */
    private center: Vector = new Vector(0, 0, 0);

    /** the semi-major axis */
    private _a: number = 0;
    /** the semi-minor axis */
    private _b: number = 0;

    /** cached semi-major axis length (the greater of a and b) */
    private _sMaj: number | null = null;

    /** cached semi-minor axis length (the lesser of a and b) */
    private _sMin: number | null = null;

    /** cached "focal distance" (for lack of a better term...) */
    private _c: number | null = null;

    /** cached eccentricity */
    private _e: number| null = null;

    /** construct a new Ellipse instance with semi-major axis a, semi-minor axis
     * b, and geometric center defined by its literal x and y coordinates or as
     * a Vector instance reflecting the same; all default to 0
     */
    constructor(a: number, b: number, x0: number, y0: number);
    constructor(a: number, b: number, center: Vector);
    constructor(a: number = 0, b: number = 0, c0: Vector | number = 0, c1: number = 0) {

        this._a = a;
        this._b = b;

        if(c0 instanceof Vector) {
            this.center = c0;
        }
        else {
            this.center = new Vector(c0, c1, 0);
        }
    }


    /** the x coordinate of this ellipse's geometric center */
    get x0(): number {
        return this.center.x;
    }
    /** the y coordinate of this ellipse's geometric center */
    get y0(): number {
        return this.center.y;
    }


    /** get the a axis length */
    get a(): number {
        return this._a;
    }
    /** set the a axis length */
    set a(a: number) {
        this._a = a;

        //  invalidate cached values
        this._sMaj = null;
        this._sMin = null;
    }

    /** get the b axis length */
    get b(): number {
        return this._b;
    }
    /** set the b axis length */
    set b(b: number) {
        this._b = b;

        //  invalidate cached values
        this._sMaj = null;
        this._sMin = null;
    }


    /** get the greater of a and b */
    get sMaj(): number {

        if(this._sMaj === null) {
            this._sMaj = this._a > this._b ? this._a : this._b;
        }

        return this._sMaj;
    }
    /** Replace the greater of a and b with sMaj
     *  Assigns sMaj to a if a > b, otherwise assigns sMaj to b
     */
    set sMaj(sMaj: number) {
        //  cache validity is preserved
        this._a > this._b ? this._a = sMaj : this._b = sMaj;
    }

    /** get the lesser of a and b */
    get sMin(): number {

        if(this._sMin === null) {
            this._sMin = this._a > this._b ? this._b : this._a;
        }

        return this._sMin;
    }
    /** Replace the lesser of a and b with sMin
     *  Assigns sMin to b if a > b, otherwise assigns sMin to a
     */
    set sMin(sMin: number) {
        //  cache validity is preserved
        this._a > this._b ? this._b = sMin : this._a = sMin;
    }

    /** get the distance from this ellipse's geometric center to either/both
     * focal points (both are at the same distance) */
    get c(): number {

        if(this._c === null) {
            this._c = Math.sqrt(Math.pow(this._a, 2) - Math.pow(this._b, 2));
        }

        return this._c;
    }

    /** get this ellipse's eccentricity */
    get e() {

        if(this._e === null) {
            //  use c's getter method in case it's not cached
            this._e = this.c / this._a;
        }

        return this._e;
    }
}


export default Ellipse;
