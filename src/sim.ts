/** the sim() function is the engine powering the game - it performs
 * calculations to update the physics model, which in turn drives scene
 * rendering and gui layout.
 *
 * the model is updated starting with global parameters and progressing to
 * smaller, more localized domains.
 */

/** interface for Keplerian elements describing the position/path of a body in
 *  orbit */
interface KeplerianElements {
    sMaj:       number,     //  semi-major axis (km)
    e:          number,     //  eccentricity (unitless)
    m0:         number,     //  mean anomaly (degrees, J2000)
    iota:       number,     //  inclination (deg to J2000 ecliptic)
    longAsc:    number,     //  long. of the asc. node (deg to J2000 ecliptic)
    argP:       number,     //  argument of perihelion (deg)
    rBar:       number,     //  mean radius (km)
    mass:       number,     //  (kg)
    axiTilt:    number,     //  axial tilt (deg to orbit)
    n:          number      //  mean motion (s^-1) (angular speed)
}

/** flag allowing the simulator to be started/stopped by the gui */
let queueNextRun: boolean = false;

/** the time at which the previous run began - used to calculate delta t */
let lastRun: DOMHighResTimeStamp = 0;

/** reference time (or "epoch") for the J2000 reference frame */
const J2000: Date = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/** index of 8 planets in our solar system
 *
 * data from summary tables on respective Wikipedia pages:
 * [1] https://en.wikipedia.org/wiki/Solar_System
 *
 * data on moon orbits:
 * https://ssd.jpl.nasa.gov/?sat_elem
 * */
const planets: {readonly [name: string]: KeplerianElements} = {
    mercury: {
        sMaj:       57909050,
        e:          0.205630,
        m0:         174.796,
        iota:       7.005,
        longAsc:    48.311,
        argP:       29.124,
        rBar:       2439.7,
        mass:       3.3011 * 10 ** 23,
        axiTilt:    0.034,
        n:          Math.sqrt((2.2032 * 10 ** 13) / Math.pow(57909050, 3))
    },
    venus: {
        sMaj:       108208000,
        e:          0.006772,
        m0:         50.115,
        iota:       3.39458,
        longAsc:    76.680,
        argP:       54.884,
        rBar:       6051.8,
        mass:       4.8675 * 10 ** 24,
        axiTilt:    177.36,
        n:          Math.sqrt((3.24859 * 10 ** 14) / Math.pow(108208000, 3))
    },
    earth: {
        sMaj:       149598023,
        e:          0.0167086,
        m0:         358.617,
        iota:       0.00005,
        longAsc:    -11.26064,
        argP:       114.20783,
        rBar:       6371.0,
        mass:       5.97237 * 10 ** 24,
        axiTilt:    23.4392811,
        n:          Math.sqrt((3.986004418 * 10 ** 14) / Math.pow(149598023, 3))
    },
    mars: {
        sMaj:       227939200,
        e:          0.0934,
        m0:         19.412,
        iota:       1.850,
        longAsc:    49.558,
        argP:       286.502,
        rBar:       3389.5,
        mass:       6.4171 * 10 ** 23,
        axiTilt:    25.19,
        n:          Math.sqrt((4.282837 * 10 ** 13) / Math.pow(227939200, 3))
    },
    jupiter: {
        sMaj:       778.57 * 10 ** 6,
        e:          0.0489,
        m0:         20.020,
        iota:       1.303,
        longAsc:    100.464,
        argP:       273.867,
        rBar:       69911,
        mass:       1.8982 * 10 ** 27,
        axiTilt:    3.13,
        n: Math.    sqrt((1.26686534 * 10 ** 17) / Math.pow(778.57 * 10 ** 6, 3))
    },
    saturn: {
        sMaj:       1433.53 * 10 ** 6,
        e:          0.0565,
        m0:         317.020,
        iota:       2.485,
        longAsc:    113.665,
        argP:       339.392,
        rBar:       58232,
        mass:       5.6834 * 10 ** 26,
        axiTilt:    26.73,
        n:          Math.sqrt((3.7931187 * 10 ** 16) / Math.pow(1433.53 * 10 ** 6, 3))
    },
    uranus: {
        sMaj:       2875.04 * 10 ** 9,
        e:          0.046381,
        m0:         142.238600,
        iota:       0.773,
        longAsc:    74.006,
        argP:       96.998857,
        rBar:       25362,
        mass:       8.6810 * 10 ** 25,
        axiTilt:    97.77,
        n:          Math.sqrt((5.793939 * 10 ** 15) / Math.pow(2875.04 * 10 ** 9, 3))
    },
    neptune: {
        sMaj:       4.50 * 10 ** 12,
        e:          0.009456,
        m0:         256.228,
        iota:       1.767975,
        longAsc:    131.784,
        argP:       276.336,
        rBar:       24622,
        mass:       1.02413 * 10 ** 23,
        axiTilt:    28.32,
        n:          Math.sqrt((6.836529 * 10 ** 9) / Math.pow(4.50 * 10 ** 12, 3))
    }
};

function sim() {

    /** the time at which the current run began (in milliseconds) */
    const now: DOMHighResTimeStamp = performance.now();

    /** time elapsed since the previous run (in milliseconds) */
    const dt: number = now - lastRun;

    //  calculate new positions of planets
    //
    //  just need to add n*dt = sqrt(mu/a^3)*dt to m0
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


export {sim};
