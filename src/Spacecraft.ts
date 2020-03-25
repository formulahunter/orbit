/** Spacecraft
 *
 * Spacecraft are directly controlled by the player and can be configured to
 * optimize performance under given conditions. Multiple spacecraft can be
 * simulated at the same time (although the player can control only one at a
 * time, referred to as the "active" craft).
 */
/**
 * Parameters that determine a spacecraft's state
 *      orbital:
 *        - host body (reference planet/star)
 *        - orbital state vector @t, s
 *          - position vector, r_t {x, y, z}
 *          - velocity vector, v_t {vx, vy, vz}
 *
 *      inertial:
 *        - empty mass, me
 *        - propellant (fuel) mass, mf
 *        - payload mass, mp
 *        - center of mass, CM
 *        - center of thrust, CT
 *        - center of pressure, CP
 *        - angular moment of inertia,
 *
 *
 * Other parameters (can be derived from those above)
 *      inertial:
 *        - total mass, m
 *
 *      orbital:
 *        - semi-major axis, μ (small mu)
 *        - semi-minor axis, ν (small nu)
 *        - longitude of ascending node, Ω (capital omega)
 *        - inclination, ι (small iota)
 *        - argument of periapsis, ω (small omega)
 *        - true anomaly, γ (small gamma)
 *        - orbital period, T
 *
 *      geometric:
 *        - normal of ascent (from central body)
 *        - normal of orbital plane
 */
/**
 * Thrust calculations
 * For now, assuming that thrust vector is coincident with craft centerline (as
 * is CM and CP). More realistic would be to give each engine a thrust vector
 * (actually a tensor of one 3-vector and one scalar).
 */
/**
 * Rationale for property accessors
 * This class defines private properties and public accessor methods, e.g. for
 * mass components, as an OOP best practice and, more importantly, because they
 * will likely be needed to trigger related changes when their private values
 * are modified (thrust-to-weight ratio in the GUI, for example).
 */
import Vector from './kinematics/Vector.js';
import {WGLElementData} from './OrbitView.js';

class Spacecraft {

    private _name: string;

    /** maximum height (from surface) */
    private _height: number = 0;
    /** radius (constant along entire height) */
    private _radius: number = 0;

    /** orbital position vector (with respect to the reference body's intertial
     * frame) */
    private _pos: Vector = new Vector(0, 0, 0);
    /** orbital velocity vector (with respect to the reference body's intertial
     * frame) */
    private _vel: Vector = new Vector(0, 0, 0);

    /** maximum thrust at standard atmosphere temp/pressure */
    private _thrust_surface: number = 0;
    /** maximum thrust in a vacuum */
    private _thrust_vacuum: number = 0;

    /** empty mass of structural and propulsive components (everything except
     * propellant and payload) */
    private _mass_empty: number = -1;
    /** total instantaneous mass of the propellant */
    private _mass_propellant: number = -1;
    /** mass of the payload **/
    private _mass_payload: number = -1;
    /** total mass (sum of empty, propellant, and payload masses, recalculated
     * automatically as the former component masses are manipulated
     * ***do not assign this property manually***
     */
    private _mass_total: number = -1;

    constructor(name: string = 'noname') {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    /** get the overall height of this craft (from surface) */
    get height(): number {
        return this._height;
    }
    /** set the overall height of this craft (from surface) */
    set height(value: number) {
        this._height = value;
    }

    /** get the radius of this craft (constant along entire height) */
    get radius(): number {
        return this._radius;
    }
    /** set the radius of this craft (constant along entire height) */
    set radius(value: number) {
        this._radius = value;
    }

    /** get this craft's orbital position vector (with respect to the reference
     *  body's inertial frame */
    get pos(): Vector {
        return this._pos;
    }
    /** set this craft's orbital position vector (with respect to the reference
     *  body's inertial frame */
    set pos(value: Vector) {
        this._pos = value;
    }

    /** get this craft's orbital velocity vector (with respect to the reference
     *  body's inertial frame */
    get vel(): Vector {
        return this._vel;
    }
    /** set this craft's orbital velocity vector (with respect to the reference
     *  body's inertial frame */
    set vel(value: Vector) {
        this._vel = value;
    }

    /** get the max thrust at standard temp & pressure */
    get thrust_surface(): number {
        return this._thrust_surface;
    }
    /** set the max thrust at standard temp & pressure */
    set thrust_surface(value: number) {
        this._thrust_surface = value;
    }

    /** get the max thrust in vacuum */
    get thrust_vacuum(): number {
        return this._thrust_vacuum;
    }
    /** get the max thrust in vacuum */
    set thrust_vacuum(value: number) {
        this._thrust_vacuum = value;
    }

    /** get the total mass as the sum of empty, propellant and payload masses */
    get mass(): number {

        if(this._mass_total < 0) {

            //  all three component masses must be defined
            let empty: number = this._mass_empty;
            let fuel: number = this._mass_propellant;
            let payload: number = this._mass_payload;
            if(empty < 0 || fuel < 0 || payload < 0) {
                console.debug(`mass of spacecraft %o is indeterminate`
                    + `\nempty: ${empty}`
                    + `\npropellant: ${fuel}`
                    + `\npayload: ${payload}`, this);
                throw new TypeError(`indeterminate spacecraft mass`);
            }

            this._mass_total = empty + fuel + payload;
        }

        return this._mass_total;
    }

    /** get the empty mass (total less propellant and payload) */
    get emptyMass(): number {

        if(this._mass_empty < 0) {
            console.debug('undefined empty mass for spacecraft %o', this);
            throw new TypeError('undefined empty mass');
        }

        return this._mass_empty;
    }
    /** set the empty mass (total less propellant and payload) */
    set emptyMass(empty: number) {
        //  set the empty mass and invalidate the total mass
        this._mass_empty = empty;
        this._mass_total = -1;
    }

    /** get the propellant mass */
    get propellantMass(): number {

        if(this._mass_propellant < 0) {
            console.debug('undefined propellant mass for spacecraft %o', this);
            throw new TypeError('undefined propellant mass');
        }

        return this._mass_propellant;
    }
    /** set the propellant mass */
    set propellantMass(propellant: number) {
        //  set the empty mass and invalidate the total mass
        this._mass_propellant = propellant;
        this._mass_total = -1;
    }

    /** get the payload mass */
    get payloadMass(): number {

        if(this._mass_payload < 0) {
            console.debug('undefined payload mass for spacecraft %o', this);
            throw new TypeError('undefined payload mass');
        }

        return this._mass_payload;
    }
    /** set the payload mass */
    set payloadMass(payload: number) {
        //  set the payload mass and invalidate the total mass
        this._mass_payload = payload;
        this._mass_total = -1;
    }

    /** get a vertex array and corresponding element array */
    getElements(): WGLElementData {

        //  for now the spacecraft is a cylinder
        return this.getCylinderElements(this.radius, this.height);
    }

    /** get an array of *all* vertices and corresponding element array for a
     * cylinder of given radius, height, and radial "resolution" (in degrees)
     *
     * this method aims to minimize the number of copies made:
     *   1. only as many copies are made as *extra* instances are needed -
     *      original instances are re-used in the new arrays
     *   2. vertices are *not* duplicated where shared by coplanar faces, so
     *      none of the top or bottom center vertices are duplicated (all
     *      elements that share any of those vertices are coplanar)
     *
     * the resulting structure will contain 2 vertices (top and bottom centers)
     * plus the following for each edge around the perimeter:
     *    - 2 vertices for the top surface (1 element)
     *    - 4 vertices for the side surface (2 elements)
     *    - 2 vertices for the bottom surface (1 element)
     *
     * in total the returned object will contain (2+4+2)*n+2 Vector instances
     * where n is the number of edges: n = 360 / inc
     */
    getCylinderElements(r: number, h: number, edges: number = 12): WGLElementData {

        //  get a list of vertices
        let vertices: CylinderVertices = this.getDistinctCylinderVertices(r, h, edges);


        /*
            make a copy of each vertex for every non-coplanar face which shares
            that vertex
         */

        //  use original vertices for the top & bottom surfaces/elements
        //  make copies of each vertex for the side elements
        //  pair vertices in alternating top/bottom order
        let sideVerts: Vector[] = [];
        for(let i = 0; i < edges; ++i) {

            sideVerts.push(
                ...Vector.copy([
                    vertices.top.prmtr[i],
                    vertices.bottom.prmtr[edges - i - 1]
                ])
            );
        }

        //  add final vertices/elements to each array
        //  so that, e.g., top & bottom surfaces draw one final element
        //  connecting back to the first element
        vertices.top.prmtr.push(Vector.copy(vertices.top.prmtr[0]));
        vertices.bottom.prmtr.push(Vector.copy(vertices.bottom.prmtr[0]));
        sideVerts.push(...Vector.copy([sideVerts[0], sideVerts[1]]));

        //  concat the resulting arrays into a final vertex array
        let finalVerts: Vector[] = [
            vertices.top.cntr,
            ...vertices.top.prmtr,
            vertices.bottom.cntr,
            ...vertices.bottom.prmtr,
            ...sideVerts
        ];


        /*
            create an index array for the element array buffer
        */

        //  all vertices are arranged in proper order when they are generated
        //  (including copies), so the element vertex indices will be the same
        //  as the respective vertex indices in the vertex array
        //  the underscore (_) prefix on the _el parameter instructs the TS
        //  compiler to ignore what would otherwise be an 'unused parameter'
        //  error
        let indices: number[] = finalVerts.map((_el, ind) => ind);

        //  REVISIT: FOR DEVELOPMENT THIS METHOD GROUPS VECTORS AND INDICES INTO
        //      NESTED ARRAYS AND FLATTENS THE FINAL ARRAYS BEFORE RETURNING
        //      THESE REDUNDANT STEPS SHOULD BE REMOVED AFTER SUFFICIENT TESTING
        //      ALSO, ELIMINATE INTERMEDIATE ARRAYS AND COMPILE VERT & ELEMENT
        //      ARRAYS INCREMENTALLY
        return {
            vertices: finalVerts.map(v => v.valueOf()).flat(),
            indices: indices
        };
    }

    /** get an array of coordinates of all *distinct* vertices */
    getDistinctVertices(): CylinderVertices {
        return this.getDistinctCylinderVertices(this.radius, this.height);
    }

    /**
     * get an array of *distinct* vertices for a cylinder of given radius,
     * height, and number of edges around the perimeter
     *
     * center of bottom face will be positioned at (x, y, z) = (0, 0, 0)
     *
     * many of these vertices will need to be duplicated before passing to WebGL
     * (vertices will be assigned normals based on which face they belong to, so
     * non-coplanar faces cannot share a vertex)
     *
     * the bottom perimeter array is presented in reverse order, i.e. its
     * vertices are wound clockwise as viewed from above - when the camera is
     * facing the top of the cylinder the bottom surface will be culled, but
     * when the camera is rotated to face the bottom of the cylinder the model
     * space is effectively rotated as well so the bottom will then be wound
     * counterclockwise and the top will be clockwise.
     * this ordering also conveniently arranges the vertices in order for
     * populating buffer arrays to be used by drawElements().
     * the following diagram illustrates vertex indices (positions in the array)
     * of successive vertices around the perimeter of the cylinder (as viewed
     * from the side):
     *
     *       z
     *       |
     *       |
     *       1--2--3--4
     *       | /| /| /|
     *       |/ |/ |/ |
     *   0 --9--8--7--6--- theta
     *       |
     *       0
     *
     *   *not shown are vertices 0 & 5, the top & bottom centers, respectively
     *
     * returned array will contain 2*edges+2 Vector instances
     */
    getDistinctCylinderVertices(r: number, h: number, edges: number = 12): CylinderVertices {

        //  if either of the following is true it was probably by mistake...
        if(r === 0) {
            console.debug('spacecraft %o being drawn with 0 radius', this);
        }
        if(h === 0) {
            console.debug('spacecraft %o being drawn with 0 height', this);
        }

        let top: Vector[] = [];
        let bottom: Vector[] = [];

        //  calculate coordinates of remaining vertices
        const TWO_PI = 2 * Math.PI;
        const inc = TWO_PI / edges;    // incremental angle in radians
        let x: number, y: number;
        for(let theta = 0; theta < TWO_PI; theta += inc) {

            x = r * Math.cos(theta);
            y = r * Math.sin(theta);

            top.push(new Vector(x, y, h));
            bottom.push(new Vector(x, y, 0));
        }

        //  reverse the bottom so elements will be wound ccw
        bottom.reverse();

        //  include center vertices in returned data
        return {
            top: {
                cntr: new Vector(0, 0, h),
                prmtr: top
            },
            bottom: {
                cntr: new Vector(0, 0, 0),
                prmtr: bottom
            }
        };
    }
}


interface CylinderVertices {
    top: DiscVertices,
    bottom: DiscVertices
}

interface DiscVertices {
    cntr: Vector,
    prmtr: Vector[]
}


export {Spacecraft, WGLElementData};
