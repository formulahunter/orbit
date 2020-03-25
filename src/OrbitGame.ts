/** OrbitGame class
 */
//@ts-ignore

import {Spacecraft} from './Spacecraft.js';
import {OrbitView} from './OrbitView.js';

class OrbitGame {

    /** the game's WebGL interface */
    private view: OrbitView;

    /** the game's master crafts list contains all spacecraft represented by
     * the simulation, including the active one */
    private _crafts: Spacecraft[] = [];

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

    /** get the spacecraft at a given index in the master crafts list
     *  @throws RangeError - given index argument is out of bounds
     */
    getCraft(ind: number = 0): Spacecraft {
        if(ind > this._crafts.length || ind < 0) {
            console.debug(`invalid index ${ind} for accessing spacecraft in`
                + ` master crafts list %o`, this._crafts);
            throw new RangeError(`invalid master craft list index ${ind}`);
        }
        return this._crafts[ind];
    }
    /** add a new spacecraft and return the total number of crafts */
    addCraft(craft: Spacecraft): number {
        let ind = this._crafts.indexOf(craft);
        if(ind >= 0) {
            console.debug('master crafts list already includes %o - moving it' +
                ' to the top (end) of the list', craft);

            this._crafts.splice(ind, 1);
            return this._crafts.push(craft);
        }

        return this._crafts.push(craft);
    }
    /** remove a spacecraft, specified by index or reference, from the master
     *  crafts list amd return that spacecraft
     *
     *  @throws RangeError - numeric index argument is out of bounds or
     *      Spacecraft reference is not in the master crafts list
     */
    removeCraft(craft: Spacecraft | number): Spacecraft {
        let ind: number;
        if(craft instanceof Spacecraft) {
            ind = this._crafts.indexOf(craft);
        }
        else {
            ind = craft;
        }

        if(ind > this._crafts.length || ind < 0) {
            console.debug(`invalid index ${ind} for removing spacecraft from`
                + ` master crafts list %o`, this._crafts);
            if(craft instanceof Spacecraft) {
                console.debug(`%o was not found in the master crafts list`, craft);
            }
            throw new RangeError(`invalid master craft list index ${ind}`);
        }

        return this._crafts.splice(ind, 1)[0];
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

        //  initialize the rendering interface with element/vertex data to be
        //  rendered
        let elements = this.getCraft().getElements();
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
