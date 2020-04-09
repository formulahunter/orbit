import {cart, dist} from '../kinematics/geometry/types.js';
import {Vector} from '../kinematics/geometry/Vector.js';
import {GraphicsElementIterator} from './GraphicsElementIterator.js';


abstract class GraphicsElement {

    /** get an iterator to loop over "shallow" vertex array using for..of
     *
     * @throws {TypeError} GraphicsElement is configured with a draw mode other
     *          than TRIANGLES, TRIANGLE_STRIP, or TRIANGLE_FAN
     */
    [Symbol.iterator](): Iterator<cart> {
        return new GraphicsElementIterator(this);
    }

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
