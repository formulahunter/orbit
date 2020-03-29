import {sim, addCraft, initSim} from './sim.js';
import Spacecraft from './Spacecraft.js';

class OrbitGame {

    // @ts-ignore
    private canvas: HTMLCanvasElement;

    /** construct a game instance
     * @throws TypeError - no <canvas id="viewport"> exists in the HTML DOM
     */
    constructor() {

        //  the HTML document must include a <canvas id="viewport">
        /*let canvas = document.getElementById('viewport');
        if(!(canvas instanceof HTMLCanvasElement)) {
            console.debug(`document.getElementById('viewport') returned ${canvas}`);
            throw new TypeError('error retrieving viewport <canvas> element');
        }
        this.canvas = canvas;*/
    }

    init(): void {

        //  add a spacecraft to the simulation environment
        let explorer3 = new Spacecraft('Explorer 3');
        addCraft(explorer3);

        //  initialize the sim and run it (currently only runs once as
        //  queueNextRun is initialized to false)
        initSim();
        sim();
    }
}


export default OrbitGame;
