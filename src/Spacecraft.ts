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
import Vector from './kinematics/Vector.js';

/**
 * Rationale for property accessors
 * This class defines private properties and public accessor methods, e.g. for
 * mass components, as an OOP best practice and, more importantly, because they
 * will likely be needed to trigger related changes when their private values
 * are modified (thrust-to-weight ratio in the GUI, for example).
 */


/** an orbital class vehicle carrying a payload */
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
}


/** any thrust-producing structure - may or may not be intended for orbit
 * internal class for use in Spacecraft implementation */
class PropulsiveVehicle {

    /** interface to structural components and aggregate parameters */
    private structure: VehicleStructure = {
        components: {
            structural: [],     //  purely structural components (incl. batteries)
            reservoir: [],      //  propellant tanks, etc.
            powerplant: [],     //  engines (incl. orbital thrusters)
            payload: [],        //  "interchangable"
            external: []        //  e.g. side boosters, can be considered "spacecraft" in their own right for the purposes of implementation
        }
    };
}

/** components & methods of a vehicle's structure */
class VehicleStructure {

    private _mass_total: number = -1;
    private _mass_empty: number = -1;
    private _mass_propellant: number = -1;
    private _mass_payload: number = -1;

    /** an object mapping the CATEGORIES enum types to arrays of
     * StructuralComponents
     */
    components: StructuralComponents;

    /** construct a new VehicleStructure instance with optional
     * StructuralComponent arrays */
    constructor(structComps: StructuralComponent[] = [],
                resComps: StructuralComponent[] = [],
                powerComps: StructuralComponent[] = [],
                payComps: StructuralComponent[] = [],
                extComps: StructuralComponent[] = []) {

        this.components = {
            structural: structComps,
            reservoir: resComps,
            powerplant: powerComps,
            payload: payComps,
            external: extComps
        };
    }



    /** get the total mass as the sum of empty, propellant and payload masses */
    get mass(): number {

        if(this._mass_total < 0) {

            let mass: number = 0;
            for(let type in this.components) {
                //@ts-ignore
                for(let comp of this.components[type]) {
                    if(!this.components.hasOwnProperty(type)) {
                        continue;
                    }
                    mass += comp.mass;
                }
                for(let i = 0; i < this.components[type].length; i++) {

                }
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

    /** get the propellant mass */
    get propellantMass(): number {

        if(this._mass_propellant < 0) {
            console.debug('undefined propellant mass for spacecraft %o', this);
            throw new TypeError('undefined propellant mass');
        }

        return this._mass_propellant;
    }

    /** get the payload mass */
    get payloadMass(): number {

        if(this._mass_payload < 0) {
            console.debug('undefined payload mass for spacecraft %o', this);
            throw new TypeError('undefined payload mass');
        }

        return this._mass_payload;
    }
}

type Partial<T> = {
    [P in keyof T]?: T[P];
}
interface StructuralComponents {
    structural: StructuralComponent[],
    reservoir: StructuralComponent[],
    powerplant: StructuralComponent[],
    payload: StructuralComponent[],
    external: StructuralComponent[]
}

class StructuralComponent {



}

export default Spacecraft;
