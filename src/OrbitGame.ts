/** OrbitGame class
 */
//@ts-ignore

import {sim, getCraft, addCraft, initSim} from './sim.js';
import {Spacecraft} from './Spacecraft.js';

class OrbitGame {

    /** construct a game instance
     *
     * @throws {TypeError} thrown by OrbitView() if no <canvas id="viewport">
     *          exists in the HTML DOM
     */
    constructor() {

    }

    /** initialize the game - load the last saved simulation state, initialize
     * the simulation (but don't start it), render the resulting static scene,
     * and initialize the gui with any context-specific interface. return 0 on
     * success, -1 on failure
     *
     * simulation time, planets, spacecraft etc.
     */
    init(): number {

        //  load the last saved simulation state
        //  initialize a new one if no prior states are saved in local storage

        //  initialize the simulator with loaded state data

        //  add a spacecraft to the simulation environment
        let explorer3 = new Spacecraft('Explorer 3');
        addCraft(explorer3);

        //  initialize the sim
        initSim();

        //  run the sim
        sim();

        return 0;
    }
}


export {OrbitGame};
