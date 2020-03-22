//@ts-ignore
import {mat4} from '../ext/gl-matrix/index.js';

import {Spacecraft, WGLElementData} from './Spacecraft.js';

type ShaderProgramInfo = {
    program: WebGLProgram,
    attributes: {
        [atr: string]: GLint
    },
    uniforms: {
        [uni: string]: WebGLUniformLocation | null
    }
};
type BufferIndex = {
    [buf: string]: WebGLBuffer
};

function triplets<T>(acc: T[][], val:T): T[][] {
    if(acc[acc.length-1].length < 3) {
        acc[acc.length-1].push(val);
    }
    else {
        acc.push([val]);
    }
    return acc;
}

/** vertex shader source code */
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;
/** fragment shader source code */
const fsSource = `
    varying lowp vec4 vColor;
    
    void main() {
      gl_FragColor = vColor;
    }
  `;

class OrbitGame {

    /** canvas element */
    private canvas: HTMLCanvasElement;

    /** viewport size (canvas element's clientHeight and clientWidth) */
    private vpSize: [number, number] = [-1, -1];

    /** WebGL rendering context
     * Consider possible benefits of using a WebGL2RenderingContext if/when
     * supported */
    private wgl: WebGLRenderingContext;
    /** the game's master crafts list contains all spacecraft represented by
     * the simulation, including the active one */
    private _crafts: Spacecraft[] = [];

    /** construct a game instance
     * @throws TypeError - no <canvas id="viewport"> exists in the HTML DOM
     */
    constructor() {

        //  the HTML document must include a <canvas id="viewport">
        let canvas = document.getElementById('viewport');
        if(!(canvas instanceof HTMLCanvasElement)) {
            console.debug(`document.getElementById('viewport') returned ${canvas}`);
            throw new TypeError('error retrieving viewport <canvas> element');
        }
        this.canvas = canvas;
        this.vpSize = [canvas.clientWidth, canvas.clientHeight];
        canvas.width = this.vpSize[0];
        canvas.height = this.vpSize[1];

        let ctx: WebGLRenderingContext | null = this.canvas.getContext('webgl');
        if(!(ctx instanceof WebGLRenderingContext)) {
            console.debug(`canvas.getContext(\'webgl\') returned ${ctx}`);
            throw new TypeError('error retrieving a WebGLRenderingContext' +
                ' from the <canvas> element - your browser may not support' +
                ' WebGL');
        }
        this.wgl = ctx;
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

    /** initialize the game - simulation time, planets, spacecraft etc. - and
     * return 0 on success, -1 on failure
     *
     * this particular implementation of the init() method is based on MDN's
     * WebGL tutorial, and specifically on the section titled 'Using shaders to
     * apply color in WebGL'
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
     */
    init(): number {

        //  compile and link a shader program from vertex & fragment shader
        //  sources
        let shader: WebGLProgram;
        try {
            shader = this.initShaderProgram(vsSource, fsSource);
        }
        catch(er) {
            console.error(`error initializing the shader program: ${er.toString()}`);
            return -1;
        }

        //  store input locations for later use
        //@ts-ignore
        const programInfo: ShaderProgramInfo = {
            program: shader,
            attributes: {
                vertexPosition: this.wgl.getAttribLocation(shader, 'aVertexPosition'),
                vertexColor: this.wgl.getAttribLocation(shader, 'aVertexColor')
            },
            uniforms: {
                projectionMatrix: this.wgl.getUniformLocation(shader, 'uProjectionMatrix'),
                modelViewMatrix: this.wgl.getUniformLocation(shader, 'uModelViewMatrix')
            }
        };
        if(!(programInfo.uniforms.projectionMatrix instanceof WebGLUniformLocation)
            || !(programInfo.uniforms.modelViewMatrix instanceof WebGLUniformLocation)) {
            console.debug('invalid uniform location reported from shader' +
                ' program: %o', programInfo.uniforms);
            throw new TypeError('invalid shader program uniform location');
        }

        //  initialize the position buffer with the square's vertex coordinates
        let buffers: BufferIndex;
        try {
            buffers = this.initBuffers();
        }
        catch(er) {
            console.error(`error initializing buffers: ${er.toString()}`);
            return -1;
        }

        //  draw the scene
        this.drawScene(programInfo, buffers);

        return 0;
    }


    /** draw the scene's current state
     *
     * THIS IMPLEMENTATION ASSUMES A CYLINDRICAL SHAPE WITH EXACTLY 12 EDGES
     */
    drawScene(programInfo: ShaderProgramInfo, buffers: BufferIndex): void {

        this.wgl.viewport(0, 0, this.vpSize[0], this.vpSize[1]);

        //  set the clear color (opaque black) and depth (100%)
        //  configure relations of objects at different depths (?)
        this.wgl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.wgl.clearDepth(1.0);                 // Clear everything
        this.wgl.enable(this.wgl.DEPTH_TEST);     // Enable depth testing
        this.wgl.depthFunc(this.wgl.LEQUAL);      // Near things obscure far things

        //  clear the canvas before drawing on it
        //  same as with CanvasRenderingContext2D
        this.wgl.clear(this.wgl.COLOR_BUFFER_BIT | this.wgl.DEPTH_BUFFER_BIT);

        //  define the field of view, aspect ratio, and near and far z-bounds
        //  these parameters will be used to calculate elements in a 4x4
        //  projection matrix
        let fov: number = 45 * Math.PI / 180;   // in radians
        let aspect: number = this.vpSize[0] / this.vpSize[1];
        let zNear: number = 0.1;
        let zFar: number = 100.0;

        //  create a perspective matrix and calculate its elements
        const projectionMatrix: mat4 = mat4.create();
        mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

        //  create a matrix where the square should be drawn and offset it
        //  slightly from the origin (mat4.create() returns a new 4x4 identity
        //  matrix)
        //  not sure why MDN shows explicit floats or the negative zero?
        const modelViewMatrix: mat4 = mat4.create();
        mat4.translate(modelViewMatrix,     //  destination matrix
                        modelViewMatrix,    //  source matrix
                        [-0.0, 0.0, -16.0]);  //  amount to translate
        mat4.rotateX(modelViewMatrix, modelViewMatrix, 3 * Math.PI / 8);
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, 3 * Math.PI / 4);
        mat4.scale(modelViewMatrix, modelViewMatrix, [3.0, 3.0, 3.0]);

        //  describe exactly what the values entered into the position buffer
        //  are (i.e. each "position" defined in initBuffers() is a pair of
        //  32-bit floats)
        //  tell wgl to pull those values out of the array buffer into the
        //  vertexPosition attribute in the vertex shader source (no attributes
        //  declared in the fragment shader but they would be indicated the same
        //  way here)
        //
        //  note the use of curly braces to create an isolated variable scope
        {
            const numComponents: number = 3;        //  x, y, z
            const type: GLenum = this.wgl.FLOAT;    // the coordinates are 32bit floats
            const normalize: boolean = false;       // don't normalize
            const stride: number = 0;               // how many bytes to get from one set of values to the next
                                                    // 0 => use type and numComponents above
            const offset: number = 0;               // how many bytes inside the buffer to start from
            this.wgl.bindBuffer(this.wgl.ARRAY_BUFFER, buffers.position);
            this.wgl.vertexAttribPointer(
                programInfo.attributes.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            this.wgl.enableVertexAttribArray(
                programInfo.attributes.vertexPosition);
        }

        //  tell wgl how to pull color attributes from the color array buffer
        {
            const numComponents: number = 4;        //  4 values each (rgba)
            const type: GLenum = this.wgl.FLOAT;
            const normalize: boolean = false;
            const stride: number = 0;
            const offset: number = 0;
            this.wgl.bindBuffer(this.wgl.ARRAY_BUFFER, buffers.color);
            this.wgl.vertexAttribPointer(
                programInfo.attributes.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            this.wgl.enableVertexAttribArray(
                programInfo.attributes.vertexColor);
        }

        //  designate the program to use when drawing
        this.wgl.useProgram(programInfo.program);

        //  designate shader uniforms declared in the vertex shader (no uniforms
        //  declared in the fragment shader but they would be indicated the same
        //  way here)
        this.wgl.uniformMatrix4fv(
            programInfo.uniforms.projectionMatrix,
            false,
            projectionMatrix
        );
        this.wgl.uniformMatrix4fv(
            programInfo.uniforms.modelViewMatrix,
            false,
            modelViewMatrix
        );

        this.wgl.bindBuffer(this.wgl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        //  draw the bottom and top surfaces as triangle fans
        {
            //  draw bottom surface
            let offset: number = 0;
            let vertexCount: number = 14;
            let type = this.wgl.UNSIGNED_SHORT;
            this.wgl.drawElements(this.wgl.TRIANGLE_FAN, vertexCount, type, offset);

            // draw top surface
            offset = 14;
            this.wgl.drawElements(this.wgl.TRIANGLE_FAN, vertexCount, type, offset);
        }

        //  draw the side surfaces as a triangle strip
        {
            let offset: number = 28;
            let vertexCount: number = 26;
            let type: GLenum = this.wgl.UNSIGNED_SHORT;
            this.wgl.drawElements(this.wgl.TRIANGLE_STRIP, vertexCount, type, offset);
        }
    }

    /** helper method to automate compiling/linking a shader program
     * @throws TypeError - likely due to a failed compilation/link; refer to
     *          specific debug info in the WebConsole
     */
    initShaderProgram(vsSource: string, fsSource: string): WebGLProgram {

        //  compile/verify the vertex and fragment shaders
        let vertexShader: WebGLShader = this.compileShader(this.wgl.VERTEX_SHADER, vsSource);
        let fragmentShader: WebGLShader = this.compileShader(this.wgl.FRAGMENT_SHADER, fsSource);

        //  create the shader program
        const program: WebGLProgram | null = this.wgl.createProgram();
        if(!(program instanceof WebGLProgram)) {
            console.debug('invalid program returned from wgl.createProgram():' +
                ' %o', program);
            throw new TypeError('invalid shader program');
        }

        //  attach and link the vertex & fragment shaders
        this.wgl.attachShader(program, vertexShader);
        this.wgl.attachShader(program, fragmentShader);
        this.wgl.linkProgram(program);

        //  verify successful links
        if(!this.wgl.getProgramParameter(program, this.wgl.LINK_STATUS)) {
            console.debug('shader program info log dump: ' + this.wgl.getProgramInfoLog(program));
            throw new TypeError('error linking the shader program');
        }

        return program;
    }

    /** helper method to compile shaders of a given type from source
     * @throws TypeError - most likely due to compiler failure; refer to
     *              specific debug info in the WebConsole
     */
    compileShader(type: GLenum, source: string): WebGLShader {

        //  get a shader from the webgl drawing context
        const shader: WebGLShader | null = this.wgl.createShader(type);
        if(!(shader instanceof WebGLShader)) {
            //  get the type of shader as they key associated with the property
            //  whose value matches the enum value argument 'type'
            let typeStr: string = Object.entries(this.wgl)
                                    .filter((ent) => ent[1] === type)[0]?.[0];
            console.debug('invalid %s shader returned from' +
                ' wgl.createShader(): %o', typeStr, shader);
            throw new TypeError(`invalid ${typeStr} shader`);
        }

        //  compile the shader source code & verify success
        this.wgl.shaderSource(shader, source);
        this.wgl.compileShader(shader);
        if(!this.wgl.getShaderParameter(shader, this.wgl.COMPILE_STATUS)) {
            //  get the type of shader as they key associated with the property
            //  whose value matches the enum value argument 'type'
            let typeStr: string = Object.entries(this.wgl)
                                .filter((ent) => ent[1] === type)[0]?.[0];
            console.debug('An error occurred compiling the %s shader: %s',
                            typeStr, this.wgl.getShaderInfoLog(shader));
            this.wgl.deleteShader(shader);
            throw new TypeError(`error compiling ${typeStr} shader`);
        }

        return shader;
    }

    /** initialize and return a buffer for vertices of the first spacecraft in
     * the master craft list
     *
     * THIS IMPLEMENTATION ASSUMES A CYLINDRICAL SHAPE WITH EXACTLY 12 EDGES
     *
     * @throws TypeError - wgl.createBuffer returned an invalid buffer */
    initBuffers(): BufferIndex {

        //  create a buffer to store the square's vertex positions
        const positionBuffer: WebGLBuffer | null = this.wgl.createBuffer();
        if(!(positionBuffer instanceof WebGLBuffer)) {
            console.debug('invalid buffer returned from wgl.createBuffer():' +
                ' %o', positionBuffer);
            throw new TypeError(`invalid position buffer`);
        }

        //  this designates 'positionBuffer' as the one to which buffer ops
        //  should be applied
        this.wgl.bindBuffer(this.wgl.ARRAY_BUFFER, positionBuffer);

        //  get vertex & element arrays for the craft
        const elements: WGLElementData = this.getCraft().getElements();
        console.debug('final vertices array: %o', elements.vertices);
        console.debug('(x, y, z coords: %0',
            elements.vertices.map(val => val.toFixed(3))
            // @ts-ignore
                             .reduce(triplets, [[]]));
        console.debug('final indices array: %o', elements.indices);

        //  fill the array buffer with a typed array derived from the positions
        //  array previously defined
        //  indicate that this data will be used unchanged for "many" draw
        //  cycles/commands
        //
        //  note the exceptions that may be thrown: wgl.OUT_OF_MEMORY,
        //  wgl.INVALID_VALUE, & wgl.INVALID_ENUM
        //  see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
        this.wgl.bufferData(this.wgl.ARRAY_BUFFER,
                            Float32Array.from(elements.vertices),
                            this.wgl.STATIC_DRAW);

        //  define color sequences for the bottom/top and side surfaces
        //  bottom/top surfaces drawn with a conic gradient where theta=0 is
        //  black, theta=2pi is white, and the center vertex is black
        //  side vertices alternate between white & black: each pair of top
        //  & bottom vertex is assigned the opposite color as the previous,
        //  with the possible exception of the vertices @ theta=0 in the case
        //  that the number of edges is odd
        const edges = 12;

        //  start with the bottom surface
        //  center black node & 13 perimeter nodes blended from black to white
        let colors: number[] = [0.0, 0.0, 0.0, 1.0];  // bot/center always blk
        let shade: number;
        //  number of edges + 1 node duplicated (also makes last shade 12/12=1)
        for(let i = 0; i < edges + 1; i++) {
            shade = i / edges;
            colors.push(shade, shade, shade, 1.0);
        }
        //  add another copy of this gradient for the top surface
        colors = colors.concat(colors.slice());

        //  alternate *pairs* of vertices between black & white
        for(let i = 0; i < edges + 1; i++) {
            shade = i % 2.0;
            colors.push(shade, shade, shade, 1.0, shade, shade, shade, 1.0);
        }
        console.debug('final color array: %o', colors);


        const colorBuffer: WebGLBuffer | null = this.wgl.createBuffer();
        if(!(colorBuffer instanceof WebGLBuffer)) {
            console.debug('invalid buffer returned from wgl.createBuffer():' +
                ' %o', colorBuffer);
            throw new TypeError(`invalid color buffer`);
        }
        this.wgl.bindBuffer(this.wgl.ARRAY_BUFFER, colorBuffer);
        this.wgl.bufferData(this.wgl.ARRAY_BUFFER,
                            Float32Array.from(colors),
                            this.wgl.STATIC_DRAW);

        const indexBuffer = this.wgl.createBuffer();
        if(!(indexBuffer instanceof WebGLBuffer)) {
            console.debug('invalid buffer returned from wgl.createBuffer():' +
                ' %o', indexBuffer);
            throw new TypeError(`invalid index buffer`);
        }
        this.wgl.bindBuffer(this.wgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.wgl.bufferData(this.wgl.ELEMENT_ARRAY_BUFFER,
                            Uint16Array.from(elements.indices),
                            this.wgl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer
        };
    }
}


export default OrbitGame;
