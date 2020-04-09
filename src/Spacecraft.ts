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
import {GraphicsElement} from './rendering/GraphicsElement.js';
import {Vector} from './geometry/Vector.js';
import {DataIndex} from './rendering/DataIndex.js';
import {TWO_PI} from './constants.js';


class Spacecraft extends GraphicsElement {

    private _name: string;

    /** maximum height (from surface) */
    private _height: number = 0;
    /** radius (constant along entire height) */
    private _radius: number = 0;

    /** orbital position vector (with respect to the reference body's intertial
     * frame) */
    private _pos: Vector = new Vector(0, 0, 0);

    /** primitive 3D geometric components making up the form of the
     * spacecraft */
    private _components: SpacecraftComponent[] = [];

    constructor(name: string = 'noname') {
        super();

        this._name = name;
        this.addComponent(new Cylinder(6, 2));
        // console.log('cylinder elements: %o', this.getComponent().elements);
        // console.log('removed component: %o', this.removeComponent(0));
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

    /** get an array of all vertices of this spacecraft's components */
    thick(): Vector[] {
        return this.vectorArray;
    }

    /** get all vertices of components of this spacecraft */
    get vectorArray(): Vector[] {

        let verts: Vector[] = [];
        for(let i = 0; i < this._components.length; ++i) {
            verts = verts.concat(this.getComponent(i).vectorArray);
        }

        return verts;
    }
    /** get vertex and index arrays of all components of this spacecraft */
    get elements(): DataIndex {

        let compElements: DataIndex[] = [];
        let counts: {[key in keyof DataIndex]: number} = {
            position: 0,
            color: 0,
            normal: 0,
            index: 0
        };
        for(let i = 0; i < this._components.length; ++i) {
            compElements.push(this.getComponent(i).elements);
            counts.position += compElements[i].position.length;
            counts.color += compElements[i].color.length;
            counts.normal += compElements[i].normal.length;
            counts.index += compElements[i].index.length;
        }

        let elements: DataIndex = {
            position: new Float32Array(counts.position),
            color: new Float32Array(counts.color),
            normal: new Float32Array(counts.normal),
            index: new Uint16Array(counts.index)
        };
        let offset: {[key in keyof DataIndex]: number} = {
            position: 0,
            color: 0,
            normal: 0,
            index: 0
        };
        for(let comp of compElements) {
            //  add comp's data to aggregate arrays
            elements.position.set(comp.position, offset.position);
            elements.color.set(comp.color, offset.color);
            elements.normal.set(comp.normal, offset.normal);
            elements.index.set(comp.index.map(ind => ind + offset.index), offset.index);

            //  update offsets
            offset.position += comp.position.length;
            offset.color += comp.color.length;
            offset.normal += comp.normal.length;
            offset.index += comp.index.length;
        }

        return elements;
    }

    /** get the component at a given index in the components list (defaults to
     * first component in list)
     *
     * @throws RangeError - given index argument is out of bounds
     */
    getComponent(ind: number = 0): SpacecraftComponent {
        if(ind > this._components.length || ind < 0) {
            console.debug(`invalid index ${ind} for accessing component in`
                + ` spacecraft %o`, this);
            throw new RangeError(`invalid spacecraft component index ${ind}`);
        }
        return this._components[ind];
    }

    /** add the given component to this spacecraft's construction and return
     * the total number of components. if the component already exists in this
     * spacecraft, move it to the end (top) of the list */
    addComponent(comp: SpacecraftComponent): number {

        let ind: number = this._components.indexOf(comp);
        if(ind < 0) {
            this._components.splice(ind, 1);
        }

        return this._components.push(comp);
    }

    /** remove a component, specified by index or reference, from the spacecraft
     *  and return that component
     *
     *  @throws RangeError - numeric index argument is out of bounds or
     *      Spacecraft reference is not in the master crafts list
     */
    removeComponent(comp: SpacecraftComponent | number) {

        let ind: number;
        if(comp instanceof SpacecraftComponent) {
            ind = this._components.indexOf(comp);
        }
        else {
            ind = comp;
        }

        if(ind > this._components.length || ind < 0) {
            console.debug(`invalid index ${ind} for removing component from`
                + ` spacecraft %o`, this);
            if(comp instanceof SpacecraftComponent) {
                console.debug(`%o was not found in the components list`, comp);
            }
            throw new RangeError(`invalid spacecraft component index ${ind}`);
        }

        return this._components.splice(ind, 1)[0];
    }
}


abstract class SpacecraftComponent extends GraphicsElement {

    /** the position of the component wrt the spacecraft's reference frame -
     * given in terms of a designated vertex determined by shape (subclass) */
    protected _pos: Vector = new Vector;

    /** get the component's position vector wrt the spacecraft's reference
     * frame */
    get pos(): Vector {
        return Vector.copy(this._pos);
    }

    /** get an array of geometric vertices as vectors */
    abstract get vectorArray(): Vector[];

    /** get a vertex array and corresponding element array */
    abstract get elements(): DataIndex;
}


/** interface organizing vertices based on how they're used in calculations */
interface CylinderVerts {
    btm: {
        cntr: Vector,
        prmtr: Vector[]
    },
    top: {
        cntr: Vector,
        prmtr: Vector[]
    }
}


/** a cylinder is defined by a height and two separate radii - the first for the
 * bottom surface and the second for the top. the second is optional and is
 * equal to the first by default.
 *
 * cylinders define their own "local" reference frames such that the center
 * of the "bottom" face coincides with the origin, and their length extends in
 * the positive z (vertical) direction.
 */
class Cylinder extends SpacecraftComponent {

    /** length in the (local) z direction */
    private _dz: number;

    /** radius of the bottom surface */
    private _r0: number;

    /** radius of the top surface */
    private _r1: number;

    /** vertices forming the shape of this cylinder instance */
    private _verts: Vector[];

    /** number of edges used to represent a circular perimeter */
    static readonly edgeCount: number = 12;

    /** coordinates of all vertices for a cylinder with dz = r0 = r1 = 1;
     * vertices for an arbitrary instance can be found by scaling, translating,
     * and rotating these as appropriate
     *
     * note the order of vertices - bottom center, top center, bottom
     * perimeter, top perimeter
     */
    static readonly unitVerts: CylinderVerts = {
        btm: {
            cntr: new Vector(0, 0, 0),
            //  create an empty array of the required number of vertices and map
            //  to angles by dividing index / edgeCount
            prmtr: (new Array(Cylinder.edgeCount)).fill(0).map(
                //  underscore prefix tells TS to ignore unused parameter
                (_el, ind) => {
                    return [
                        Math.cos(ind * TWO_PI / Cylinder.edgeCount),
                        Math.sin(ind * TWO_PI / Cylinder.edgeCount),
                        0   //  bottom surface
                    ];
                }
            ).map(vert => {
                return new Vector(vert[0], vert[1], vert[2])
            })
        },
        top: {
            //  create an empty array of the required number of vertices and map
            //  to angles by dividing index / edgeCount
            cntr: new Vector(0, 0, 1),
            prmtr: (new Array(Cylinder.edgeCount)).fill(0).map(
                //  underscore prefix tells TS to ignore unused parameter
                (_el, ind) => {
                    return [
                        Math.cos(ind * TWO_PI / Cylinder.edgeCount),
                        Math.sin(ind * TWO_PI / Cylinder.edgeCount),
                        1   //  top surface
                    ];
                }
            ).map(vert => {
                return new Vector(vert[0], vert[1], vert[2])
            })
        }
    };

    /** construct a cylinder with given height, primary radius and optional
     * secondary radius (equal to the primary radius by default) */
    constructor(dz: number, r0: number, r1: number = r0) {
        super();
        this._dz = dz;
        this._r0 = r0;
        this._r1 = r1;
        this._verts = Cylinder.getVectors(dz, r0, r1);
    }

    /**
     * get an array of *distinct* vertices for a cylinder of given height,
     * primary radius, and secondary radius
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
    static getVectors(dz: number, r0: number, r1: number): Vector[] {
        return [
            Cylinder.unitVerts.btm.cntr.copy(),
            ...Cylinder.unitVerts.btm.prmtr.map(vert => vert.scale(r0)),
            Cylinder.unitVerts.top.cntr.scale(dz),
            ...Cylinder.unitVerts.top.prmtr.map(vert => vert.scale([r1, r1, dz]))
        ];
    }

    /** get the height/length of this cylinder */
    get dz(): number {
        return this._dz;
    }

    /** get the primary radius of this cylinder */
    get r0(): number {
        return this._r0;
    }

    /** get the secondary radius of this cylinder */
    get r1(): number {
        return this._r1;
    }

    /** get an array of vertices forming the shape of this cylinder */
    get vectorArray(): Vector[] {
        return this._verts.map(Vector.copy);
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
    get elements(): DataIndex {

        //  get a list of vertices
        let vertices: Vector[] = this.vectorArray;

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
        let sideVerts: Vector[] = [];let topVerts: Vector[] = [];

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
            position: Float32Array.from(finalVerts.map(v => v.valueOf()).flat()),
            color: Float32Array.from([]),
            normal: Float32Array.from([]),
            index: Uint16Array.from(bottom.concat(sides).concat(top).flat())
        };
    }

    /** get an array of all vertices forming the shape of this cylinder */
    thick(): Vector[] {
        return this.vectorArray;
    }
}


export {Spacecraft};
