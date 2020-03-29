/** sim function & environment (model data)
 *
 * the simulation is implemented as a function and not a class in anticipation
 * of using a ServiceWorker to execute it on a separate thread from the main UI.
 */

import Spacecraft from './Spacecraft.js';

/** function to get/set true anomaly given M0 and time since epoch
 * defined on KeplerianElements interface below as method 'gamma'
 */
function getTrueAnomAt(this: KeplerianElements, timeSinceEpoch: number) {
    return (this.M0 + this.n * timeSinceEpoch) % (2 * Math.PI);
}

/** interface for Keplerian elements describing the position/path of a body in
 *  orbit */
interface KeplerianElements {
    sMaj:       number,     //  semi-major axis (km)
    e:          number,     //  eccentricity (unitless)
    M0:         number,     //  mean anomaly at epoch (radians, J2000, 0 <= M0 < 2pi)
    incl:       number,     //  inclination (rad to J2000 ecliptic, 0 <= incl <= pi)
    longAsc:    number,     //  long. of the asc. node (rad to J2000 ecliptic, 0 <= longAsc < 2pi)
    argP:       number,     //  argument of pericenter (rad, 0 <= argP < 2pi)
    M:          number,     //  current mean anomaly (radians, 0 <= M < 2pi)
    rBar:       number,     //  mean radius (km)
    mass:       number,     //  (kg)
    axiTilt:    number,     //  axial tilt (rad to orbital plane, 0 <= axiTilt <= pi)
    n:          number      //  mean motion (s^-1) (angular speed),
    gamma:      (time: number) => number
}

/** flag allowing the simulator to be started/stopped by the gui */
let queueNextRun: boolean = false;

/** the time at which the previous run began - used to calculate delta t */
let lastRun: DOMHighResTimeStamp = 0;

/** reference time (or "epoch") for the J2000 reference frame */
const J2000: number = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/** game clock time wrt epoch
 * revisit - save with player data and load at init to be used in sim
 */
let gameTime: number = /*player.gameTime*/ 0;

/** speed at which simulator is running */
let simSpeed: number = 1;

/** index of 8 planets in our solar system
 *
 * "For several objects in the Solar System, the value of μ is known to greater
 * accuracy than either G or M"
 *  - https://en.wikipedia.org/wiki/Standard_gravitational_parameter
 *
 * data from summary tables on respective Wikipedia pages:
 * [1] https://en.wikipedia.org/wiki/Solar_System
 *
 * data on moon orbits:
 * https://ssd.jpl.nasa.gov/?sat_elem
 *
 * todo - planets & activePlanet are just object literals that implement the
 *  KeplerianElements interface. it may be beneficial to formalize the Planet
 *  definition with a class of its own (at some point)
 */
const planets: {readonly [name: string]: KeplerianElements} = {
    mercury: {
        sMaj:       57909050,
        e:          0.205630,
        M0:         174.796 * Math.PI / 180,
        incl:       7.005 * Math.PI / 180,
        longAsc:    48.311 * Math.PI / 180,
        argP:       29.124 * Math.PI / 180,
        M:          -1,
        rBar:       2439.7,
        mass:       3.3011 * 10 ** 23,
        axiTilt:    0.034,
        n:          Math.sqrt((2.2032 * 10 ** 13) / Math.pow(57909050, 3)),
        gamma:      getTrueAnomAt
    },
    venus: {
        sMaj:       108208000,
        e:          0.006772,
        M0:         50.115 * Math.PI / 180,
        incl:       3.39458 * Math.PI / 180,
        longAsc:    76.680 * Math.PI / 180,
        argP:       54.884 * Math.PI / 180,
        M:          -1,
        rBar:       6051.8,
        mass:       4.8675 * 10 ** 24,
        axiTilt:    177.36,
        n:          Math.sqrt((3.24859 * 10 ** 14) / Math.pow(108208000, 3)),
        gamma:      getTrueAnomAt
    },
    earth: {
        sMaj:       149598023,
        e:          0.0167086,
        M0:         358.617 * Math.PI / 180,
        incl:       0.00005 * Math.PI / 180,
        longAsc:    -11.26064 * Math.PI / 180,
        argP:       114.20783 * Math.PI / 180,
        M:          -1,
        rBar:       6371.0,
        mass:       5.97237 * 10 ** 24,
        axiTilt:    23.4392811,
        n:          Math.sqrt((3.986004418 * 10 ** 14) / Math.pow(149598023, 3)),
        gamma:      getTrueAnomAt
    },
    mars: {
        sMaj:       227939200,
        e:          0.0934,
        M0:         19.412 * Math.PI / 180,
        incl:       1.850 * Math.PI / 180,
        longAsc:    49.558 * Math.PI / 180,
        argP:       286.502 * Math.PI / 180,
        M:          -1,
        rBar:       3389.5,
        mass:       6.4171 * 10 ** 23,
        axiTilt:    25.19,
        n:          Math.sqrt((4.282837 * 10 ** 13) / Math.pow(227939200, 3)),
        gamma:      getTrueAnomAt
    },
    jupiter: {
        sMaj:       778.57 * 10 ** 6,
        e:          0.0489,
        M0:         20.020 * Math.PI / 180,
        incl:       1.303 * Math.PI / 180,
        longAsc:    100.464 * Math.PI / 180,
        argP:       273.867 * Math.PI / 180,
        M:          -1,
        rBar:       69911,
        mass:       1.8982 * 10 ** 27,
        axiTilt:    3.13,
        n: Math.    sqrt((1.26686534 * 10 ** 17) / Math.pow(778.57 * 10 ** 6, 3)),
        gamma:      getTrueAnomAt
    },
    saturn: {
        sMaj:       1433.53 * 10 ** 6,
        e:          0.0565,
        M0:         317.020 * Math.PI / 180,
        incl:       2.485 * Math.PI / 180,
        longAsc:    113.665 * Math.PI / 180,
        argP:       339.392 * Math.PI / 180,
        M:          -1,
        rBar:       58232,
        mass:       5.6834 * 10 ** 26,
        axiTilt:    26.73,
        n:          Math.sqrt((3.7931187 * 10 ** 16) / Math.pow(1433.53 * 10 ** 6, 3)),
        gamma:      getTrueAnomAt
    },
    uranus: {
        sMaj:       2875.04 * 10 ** 9,
        e:          0.046381,
        M0:         142.238600 * Math.PI / 180,
        incl:       0.773 * Math.PI / 180,
        longAsc:    74.006 * Math.PI / 180,
        argP:       96.998857 * Math.PI / 180,
        M:          -1,
        rBar:       25362,
        mass:       8.6810 * 10 ** 25,
        axiTilt:    97.77,
        n:          Math.sqrt((5.793939 * 10 ** 15) / Math.pow(2875.04 * 10 ** 9, 3)),
        gamma:      getTrueAnomAt
    },
    neptune: {
        sMaj:       4.50 * 10 ** 12,
        e:          0.009456,
        M0:         256.228 * Math.PI / 180,
        incl:       1.767975 * Math.PI / 180,
        longAsc:    131.784 * Math.PI / 180,
        argP:       276.336 * Math.PI / 180,
        M:          -1,
        rBar:       24622,
        mass:       1.02413 * 10 ** 23,
        axiTilt:    28.32,
        n:          Math.sqrt((6.836529 * 10 ** 9) / Math.pow(4.50 * 10 ** 12, 3)),
        gamma:      getTrueAnomAt
    }
};

/** the game's master crafts list contains all spacecraft represented by
 * the simulation, including the active one */
const crafts: Spacecraft[] = [];

//  initialize M for planets & spacecraft
for(let planet in planets) {
    planets[planet].M = (planets[planet].M0 * (gameTime - J2000)) % (2 * Math.PI);
}
for(let craft of crafts) {
    craft.orbit.M = (craft.orbit.M0 * gameTime) % (2 * Math.PI);
}

/** the central body around which the active spacecraft is orbiting */
let activePlanet: KeplerianElements = planets['earth'];

/** the active spacecraft, i.e. the one being actively controlled by the
 *  player */
let activeCraft: Spacecraft = getCraft();


/** the sim() function is the engine powering the game - it performs
 * calculations to update the physics model, which in turn drives scene
 * rendering and gui layout.
 *
 * the model is updated starting with global parameters and progressing to
 * smaller, more localized domains.
 */
function sim() {

    /** the time at which the current run began (in milliseconds) */
    const now: DOMHighResTimeStamp = performance.now();

    /** time elapsed since the previous run (in milliseconds) */
    const dt: number = now - lastRun;

    //  calculate new positions of active planet
    //
    //  just need to add n*dt = sqrt(mu/a^3)*dt to M
    //  https://en.wikipedia.org/wiki/Orbital_elements#Orbit_prediction
    //
    //   "For several objects in the Solar System, the value of μ is known to
    //   greater accuracy than either G or M"
    //    - https://en.wikipedia.org/wiki/Standard_gravitational_parameter

    //  update time of last run
    lastRun = now;

    //  wash, rinse, repeat
    if(queueNextRun) {
        //  if setTimeout() itself becomes the primary performance bottleneck
        //  see the note on postMessage() in document comments for a possible
        //  workaround
        window.setTimeout(sim);
    }
}


/** get the spacecraft at a given index in the master crafts list
 *  @throws RangeError - given index argument is out of bounds
 */
function getCraft(ind: number = 0): Spacecraft {
    if(ind > crafts.length || ind < 0) {
        console.debug(`invalid index ${ind} for accessing spacecraft in`
            + ` master crafts list %o`, crafts);
        throw new RangeError(`invalid master craft list index ${ind}`);
    }
    return crafts[ind];
}

/** add a new spacecraft and return the total number of crafts */
function addCraft(craft: Spacecraft): number {
    let ind = crafts.indexOf(craft);
    if(ind >= 0) {
        console.debug('master crafts list already includes %o - moving it' +
            ' to the top (end) of the list', craft);

        crafts.splice(ind, 1);
        return crafts.push(craft);
    }

    return crafts.push(craft);
}

/** remove a spacecraft, specified by index or reference, from the master
 *  crafts list amd return that spacecraft
 *
 *  @throws RangeError - numeric index argument is out of bounds or
 *      Spacecraft reference is not in the master crafts list
 */
function removeCraft(craft: Spacecraft | number): Spacecraft {
    let ind: number;
    if(craft instanceof Spacecraft) {
        ind = crafts.indexOf(craft);
    }
    else {
        ind = craft;
    }

    if(ind > crafts.length || ind < 0) {
        console.debug(`invalid index ${ind} for removing spacecraft from`
            + ` master crafts list %o`, crafts);
        if(craft instanceof Spacecraft) {
            console.debug(`%o was not found in the master crafts list`, craft);
        }
        throw new RangeError(`invalid master craft list index ${ind}`);
    }

    return crafts.splice(ind, 1)[0];
}


export {sim, getCraft, addCraft, removeCraft, getTrueAnomAt, KeplerianElements};
