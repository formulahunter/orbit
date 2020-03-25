/** the sim() function is the engine powering the game - it performs
 * calculations to update the physics model, which in turn drives scene
 * rendering and gui layout.
 *
 * the model is updated starting with global parameters and progressing to
 * smaller, more localized domains.
 */

/** flag allowing the simulator to be started/stopped by the gui */
let queueNextRun: boolean = false;

/** the time at which the previous run began - used to calculate delta t */
let lastRun: DOMHighResTimeStamp = 0;

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
