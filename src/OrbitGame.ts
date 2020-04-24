/** OrbitGame class
 */
import {OrbitView} from './OrbitView.js';
import {initSim} from './sim.js';

class OrbitGame {

    /** the game's WebGL interface */
    private view: OrbitView;

    /** construct a game instance */
    constructor() {
        //  the OrbitView constructor is responsible for searching for its
        //  <canvas> element
        this.view = new OrbitView();
    }

    /** initialize the game - load the last saved simulation state, initialize
     * the simulation (but don't start it), render the resulting static scene,
     * and initialize the gui with any context-specific interface
     */
    init(): void {

        //  load the last saved simulation state
        //  initialize a new one if no prior states are saved in local storage

        //  initialize the gui

        //  initialize the rendering interface
        this.view.init();

        //  initialize the sim
        initSim();
    }
}


export {OrbitGame};
