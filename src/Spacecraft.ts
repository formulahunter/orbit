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

/** this interface assumes that vertices are grouped into triplets to
 * compose triangles */
interface WGLElementData {
    vertices: number[],
    elements: number[]
}

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
    getCylinderElements(r: number, h: number, inc: number = 30): WGLElementData {

        //  get a list of vertices
        let vertices: Vector[] = this.getDistinctCylinderVertices(r, h, inc);


        /*
            make a copy of each vertex for every non-coplanar face which shares
            that vertex
         */

        //  pull out the bottom & top centers (no need to duplicate those
        //  as all the faces that share either one are coplanar)
        //  they will be placed in the final vertex array in the same positions
        let centers: Vector[] = vertices.splice(0, 2);

        //  separate vertices by surface so copies can be made as necessary
        //  note the order - bottom, side, top - must be consistent throughout
        //  this method
        let botVerts: Vector[] = [];
        let sideVerts: Vector[] = [];
        let topVerts: Vector[] = [];

        //  loop around the perimeter (note i+=2)
        //  add copies of each vertex to the appropriate vertex arrays
        //  make sure that vertex references wrap back around to the start of
        //  of the vertices array in the final iteration
        //  revisit - maybe should rethink calculating i2 & i3 on every
        //      iteration (for performance reasons)
        //      ...but then again it saves arithmetic ops in push() calls...
        let i2: number, i3: number;
        for(let i = 0; i < vertices.length; i += 2) {

            //  for index-out-of-bounds safeguard
            i2 = i + 2;
            i3 = i + 3;

            //  should only be true in the final iteration b/c i incremented
            //  by 2
            if(i3 >= vertices.length) {
                //  i + 2 => 0 & i + 3 => 1
                i2 = 0; //  (i+2)%vertices.length = 0
                i3 = 1; //  (i+3)%vertices.length = 1
            }

            //  make all copies for the side at once
            //  pass the originals to top & bottom (no need for more copies)
            botVerts.push(vertices[i + 1], vertices[i3]);
            sideVerts.push(...Vector.copy([vertices[i], vertices[i + 1],
                vertices[i2], vertices[i3]]));
            topVerts.push(vertices[i], vertices[i2]);
        }

        //  copies of all vertices have now been partitioned into either the
        //  bottom, side, or top array
        //  concat the resulting arrays into a final vertex array
        let finalVerts: Vector[] = centers.concat(botVerts)
                                          .concat(sideVerts)
                                          .concat(topVerts);


        /*
            record triplets of indices that group vertices into (triangular)
            elements
        */

        //  indices of bottom & top center vertices
        const c0: number = 0;   //  bottom
        const c1: number = 1;   //  top

        //  indices of vertices grouped by element for bottom, side, and top
        //  surfaces
        let bottom: [number, number, number][] = [];
        let sides: [number, number, number][] = [];
        let top: [number, number, number][] = [];

        //  make sure that vertex references wrap back around to the start of
        //  of the vertices array in the final iteration
        for(let i = 2; i < finalVerts.length; i += 2) {

            //  for index-out-of-bounds safeguard
            i2 = i + 2;
            i3 = i + 3;

            //  should only be true in the final iteration b/c i incremented
            //  by 2
            if(i3 >= finalVerts.length) {
                //  i + 2 => 0 & i + 3 => 1
                i2 = 0; //  (i+2)%vertices.length = 0
                i3 = 1; //  (i+3)%vertices.length = 1
            }

            //  add vector indices in groups of three
            //  one triangular elements on bottom surface
            //  two triangular elements on side surface
            //  one triangular elements on top surface
            //  node adjacent side elements drawn in same "direction" (cw)
            bottom.push([c0, i, i2]);
            sides.push([i, i + 1, i2], [i2, i + 1, i3]);
            top.push([c1, i + 1, i3]);
        }

        //  REVISIT: FOR DEVELOPMENT THIS METHOD GROUPS VECTORS AND INDICES INTO
        //      NESTED ARRAYS AND FLATTENS THE FINAL ARRAYS BEFORE RETURNING
        //      THESE REDUNDANT STEPS SHOULD BE REMOVED AFTER SUFFICIENT TESTING
        //      ALSO, ELIMINATE INTERMEDIATE ARRAYS AND COMPILE VERT & ELEMENT
        //      ARRAYS INCREMENTALLY
        return {
            vertices: finalVerts.map(v => v.valueOf()).flat(),
            elements: bottom.concat(sides).concat(top).flat()
        };
    }

    /** get an array of coordinates of all *distinct* vertices */
    getDistinctVertices(): Vector[] {
        return this.getDistinctCylinderVertices(this.radius, this.height);
    }

    /**
     * get an array of *distinct* vertices for a cylinder of given radius,
     * height, and radial "resolution" (in degrees)
     *
     * many of these vertices will need to be duplicated before passing to WebGL
     * (vertices will be assigned normals based on which face they belong to, so
     * non-coplanar faces cannot share a vertex)
     *
     * first two vertices are centers of the bottom and top faces, respectively.
     * remaining vertices ordered with alternating bottom/top vertices (see
     * diagram below).
     *
     * center of bottom face will be positioned at (x, y, z) = (0, 0, 0)
     *
     *   2--4--6--8
     *   | /| /| /|
     *   |/ |/ |/ |
     *   1--3--5--7
     *   |--|
     *    ^
     *   inc (degrees)
     *
     * returned array will contain 2*inc+2 Vector instances
     */
    getDistinctCylinderVertices(r: number, h: number, inc: number = 30): Vector[] {

        //  possibly helpful debugging output
        if(r === 0) {
            console.debug('spacecraft %o being drawn with 0 radius', this);
        }
        if(h === 0) {
            console.debug('spacecraft %o being drawn with 0 height', this);
        }

        //  start with the centers of the bottom (z = 0) and top (z = h) faces
        let vertices: Vector[] = [
            new Vector(0, 0, 0),
            new Vector(0, 0, h)
        ];

        //  calculate coordinates of remaining vertices
        const TWO_PI = 2 * Math.PI;
        inc = inc * Math.PI / 180; //  convert the increment angle to radians
        let x: number, y: number;
        for(let theta = 0; theta < TWO_PI; theta += inc) {

            x = r * Math.cos(theta);
            y = r * Math.sin(theta);

            //  push bottom first, then top
            vertices.push(new Vector(x, y, 0), new Vector(x, y, h));
        }

        return vertices;
    }
}


export {Spacecraft, WGLElementData};
