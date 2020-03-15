import Vector from './Vector.js';

class CoordinateSystem {

    readonly name: string;
    readonly parent: CoordinateSystem;
    readonly offset: Vector;

    constructor(name: string);
    constructor(name: string, parent: CoordinateSystem);
    constructor(name: string, parent: CoordinateSystem, offset: Vector);
    constructor(name: string, parent?: CoordinateSystem, offset?: Vector) {

        this.name = name;

        if(parent === undefined) {
            this.parent = CoordinateSystem.root;
        }
        else {
            this.parent = parent;
        }
        if(offset === undefined) {
            this.offset = new Vector();
        }
        else {
            this.offset = offset;
        }
    }

    static root: CoordinateSystem;

    toString(): string {
        return `CoordinateSystem{${this.name}}`;
    }

}
CoordinateSystem.root = new CoordinateSystem('root');


export default CoordinateSystem;
