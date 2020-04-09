import {cart, dist} from '../kinematics/geometry/types.js';
import {Vector} from '../kinematics/geometry/Vector.js';


abstract class GraphicsElement {

    /** get an iterator to loop over "shallow" vertex array using for..of
     *
     * @throws {TypeError} GraphicsElement is configured with a draw mode other
     *          than TRIANGLES, TRIANGLE_STRIP, or TRIANGLE_FAN
     */
    /*[Symbol.iterator](): Iterator {

        let ccw: boolean = this._winding === VertexWinding.CCW;
        let shallow: [number, number, number][] = ccw ? this.shallow() : this.shallowCW();
        let iter: Iterator = {
            _verts: shallow,
            _current: 0,
            done: (): boolean => {return this._current >= this._verts.length}

        };

        switch(this._drawMode) {
            case VertexOrder.TRIANGLES:

                break;
            case VertexOrder.TRIANGLE_FAN:

                break;
            case VertexOrder.TRIANGLE_STRIP:

                break;
            default:
                console.debug(`unsupported WebGL draw mode ${this._drawMode}`
                    + ` on %o`, this);
                throw new TypeError('unsupported WebGL draw mode');
        }
    }*/

    /** get an array of numbers representing sequential x, y, z coordinates
     * representing all of a primitive's vertices */
    flat(): dist[] {
        return this.shallow().flat();
    }

    /** get an array of nested [x, y, z] coordinate arrays representing all of a
     * primitive's vertices */
    shallow(): cart[] {
        return this.thick().map(v => v.valueOf());
    }

    /** get an array of Vectors representing all of a primitive's vertices */
    abstract thick(): Vector[];
}



export {GraphicsElement};
