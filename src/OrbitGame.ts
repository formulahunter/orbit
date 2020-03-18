import Spacecraft from './Spacecraft.js';


class OrbitGame {

    // @ts-ignore
    private canvas: HTMLCanvasElement;

    /** the game's master crafts list contains all spacecraft represented by
     * the simulation, including the active one */
    private _crafts: Spacecraft[] = [];

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

    /** get the spacecraft at a given index in the master crafts list
     *  @throws RangeError - given index argument is out of bounds
     */
    getCraft(ind: number): Spacecraft {
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
}


export default OrbitGame;
