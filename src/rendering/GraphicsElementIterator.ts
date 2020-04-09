import {cart} from '../kinematics/geometry/types.js';
import {GraphicsElement} from './GraphicsElement.js';


/** for iterative over vertices in a graphics element */
class GraphicsElementIterator implements Iterator<cart> {

    /** current iteration index */
    private _ind: number;

    /** array of vertices */
    private _verts: cart[];

    constructor(el: GraphicsElement) {

        this._verts = el.shallow();
        this._ind = 0;
    }

    next(): {done: true, value?: cart};
    next(): {done: false, value: cart};
    next(): {done: boolean, value?: cart} {

        if(this._ind < this._verts.length) {
            //  _ind is incremented after accessing the current vertex
            return {
                done: false,
                value: this._verts[this._ind++]
            };
        }

        return {done: true, value: undefined};
    }
}



export {GraphicsElementIterator};
