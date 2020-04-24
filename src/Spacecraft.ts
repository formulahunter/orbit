/** Spacecraft class
 *
 * Spacecraft are directly controlled by the player and can be configured to
 * optimize performance under given conditions. Multiple spacecraft can be
 * simulated at the same time (although the player can control only one at a
 * time, referred to as the "active" craft).
 */
import {Cylinder} from './Cylinder.js';
import {GraphicsElement} from './rendering/GraphicsElement.js';
import {getTrueAnomAt, KeplerianElements} from './sim.js';
import {Vector} from './geometry/Vector.js';
import {DataIndex} from './rendering/DataIndex.js';
import {SpacecraftComponent} from './SpacecraftComponent.js';


class Spacecraft extends GraphicsElement {

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

    /** primitive 3D geometric components making up the form of the
     * spacecraft */
    private _components: SpacecraftComponent[] = [];

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

    /** Keplerian elements describing this spacecraft's orbital plane &
     * trajectory */
    orbit: KeplerianElements = {
            sMaj:       8000,
            e:          0,
            M0:         0,
            incl:       0,
            longAsc:    0,
            argP:       0,
            M:          -1,
            rBar:       4000,
            mass:       5000,
            axiTilt:    0,
            n:          Math.sqrt((6.674 * 10 ** 11) * (5000) / Math.pow(4.50 * 10 ** 12, 3)),
            gamma:      getTrueAnomAt
    };

    constructor(name: string = 'noname') {
        super();

        this._name = name;

        //  build a basic structure
        let engine = new Cylinder(1, 1, 0.25);
        this.addComponent(engine);

        let booster = new Cylinder(8, 2);
        booster.pos = new Vector(0, 0, 1);
        this.addComponent(booster);

        let payload = new Cylinder(2, 2, 0.5);
        payload.pos = new Vector(0, 0, 9);
        this.addComponent(payload);
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
        let counts = {
            vertex: 0,
            index: 0,
        };
        for(let i = 0; i < this._components.length; ++i) {
            compElements.push(this.getComponent(i).elements);
            counts.vertex += compElements[i].vertCount;
            counts.index += compElements[i].indCount;
        }

        let elements: DataIndex = {
            vertCount: 0,
            indCount: 0,
            position: new Float32Array(3 * counts.vertex),
            color: new Float32Array(4 * counts.vertex),
            normal: new Float32Array(0),                    //  temp until normals defined
            index: new Uint16Array(counts.index)
        };
        let comp: DataIndex;
        for(let i = 0; i < compElements.length; ++i) {
            comp = compElements[i];

            //  first add comp's data to aggregate arrays using accumulated
            //  counts as offsets
            elements.position.set(comp.position, 3 * elements.vertCount);
            elements.color.set(comp.color, 4 * elements.vertCount);
            elements.normal.set(comp.normal, /*3 * elements.vertCount*/ 0);
            elements.index.set(comp.index.map(ind => ind + elements.vertCount), elements.indCount);

            //  now update counts for next iteration
            elements.vertCount += comp.vertCount;
            elements.indCount += comp.indCount;
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
        if(ind >= 0) {
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

    /** get the sum of instantaneous mass of all components */
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

    /** get the sum of empty masses of all components */
    get emptyMass(): number {

        if(this._mass_empty < 0) {
            console.debug('undefined empty mass for spacecraft %o', this);
            throw new TypeError('undefined empty mass');
        }

        return this._mass_empty;
    }

    /** get the sum of instantaneous propellant mass */
    get propellantMass(): number {

        if(this._mass_propellant < 0) {
            console.debug('undefined propellant mass for spacecraft %o', this);
            throw new TypeError('undefined propellant mass');
        }

        return this._mass_propellant;
    }

    /** get the sum of payload mass */
    get payloadMass(): number {

        if(this._mass_payload < 0) {
            console.debug('undefined payload mass for spacecraft %o', this);
            throw new TypeError('undefined payload mass');
        }

        return this._mass_payload;
    }
}


export {Spacecraft};
