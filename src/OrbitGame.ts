/** OrbitGame class
 */
//@ts-ignore

import {OrbitView} from './OrbitView.js';
import {Spacecraft} from './Spacecraft.js';
import {DataIndex} from './rendering/DataIndex.js';

class OrbitGame {

    /** the game's WebGL interface */
    private view: OrbitView;

    /** construct a game instance
     *
     * @throws {TypeError} thrown by OrbitView() if no <canvas id="viewport">
     *          exists in the HTML DOM
     */
    constructor() {

        //  the OrbitView constructor is responsible for searching for its
        //  <canvas> element
        this.view = new OrbitView();
    }

    /** initialize the OrbitView instance with mock data */
    init(): number {

        //  load the last saved simulation state
        //  initialize a new one if no prior states are saved in local storage

        //  initialize the simulator with loaded state data

        //  add a spacecraft to the simulation environment
        let explorer3 = new Spacecraft('Explorer 3');

        //  initialize the rendering interface with element/vertex data to be
        //  rendered
        let elements: DataIndex = explorer3.elements;
        this.view.init(elements);

        return 0;
    }

    /** initiate a render cycle
     *
     * after initialization, this method is the primary interface to the
     * OrbitView instance
     */
    draw(): void {

    }
}


export {OrbitGame};
