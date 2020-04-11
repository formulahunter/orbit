/** OrbitView class
 *
 * this class gets a this sim state from OrbitSim in a distilled JSON-ish data
 * structure, which it should retain and compare from one draw cycle to the next
 * with the intent to re-use buffers that already populated and for which no
 * values have changed (minimizing state changes in the webgl context is one of
 * MDN's "WebGL best practices"[1])
 *
 * [1] https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
 *
 */
//@ts-ignore
import {mat4} from '../ext/gl-matrix/index.js';
import {DataIndex} from './rendering/DataIndex.js';
import {DEG2RAD} from './constants.js';

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


/** the OrbitView class is the game's rendering engine. its objective is to
 * to extract essential model data and load it into buffers for processing in
 * WebGL.
 */
class OrbitView {

    /** canvas element */
    private canvas: HTMLCanvasElement;

    /** viewport size (canvas element's clientHeight and clientWidth) */
    private vpSize: [number, number] = [-1, -1];

    /** field of view (in degrees) */
    private _fov: number = 45 * DEG2RAD;

    /** camera position [x, y, z] */
    private _pos: [number, number, number] = [0, 0, -16];

     /** camera rotation about x, y, z axes (in degrees) */
    private _rot: [number, number] = [0, 0];

    /** model scaling [x, y, z] (unitless) */
    private _scale: [number, number, number] = [3, 3, 3];

    /** shader program, uniform & attribute info */
    private _programInfo?: ShaderProgramInfo;

    /** final WebGLBuffers (vertex position, color, normal, index, etc) */
    private _buffers?: BufferIndex;

    /** WebGL rendering context
     * Consider possible benefits of using a WebGL2RenderingContext if/when
     * supported */
    private wgl: WebGLRenderingContext;

    /** construct an OrbitView instance around a given <canvas> element
     *
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

    /** initialize the game - simulation time, planets, spacecraft etc. - and
     * return 0 on success, -1 on failure
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
     */
    init(elements: DataIndex): number {

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
        this._programInfo = programInfo;

        //  initialize the position buffer with the square's vertex coordinates
        let buffers: BufferIndex;
        try {
            buffers = this.initBuffers(elements);
        }
        catch(er) {
            console.error(`error initializing buffers: ${er.toString()}`);
            return -1;
        }
        this._buffers = buffers;

        //  draw the scene
        this.drawScene();

        return 0;
    }


    /** draw the scene's current state using static/unchanging scene data and
     * model/view/projection transforms derived from respective properties
     *
     * revisit - need to find a way to render arbitrary number of vertices in
     *   drawElements()
     *
     * @throws {TypeError} 'invalid_rendering_resources' if either _programInfo
     *          or _buffers is undefined
     */
    drawScene(): void {

        if(this._programInfo === undefined || this._buffers === undefined) {
            console.debug('cannot draw scene with undefined _programInfo' +
                ' and/or _buffers');
            throw new TypeError('invalid_rendering_resources');
        }
        const programInfo = this._programInfo;
        const buffers = this._buffers;

        this.wgl.viewport(0, 0, this.vpSize[0], this.vpSize[1]);

        //  set the clear color (opaque black) and depth (100%)
        //  configure relations of objects at different depths (?)
        this.wgl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.wgl.clearDepth(1.0);                 // Clear everything
        this.wgl.enable(this.wgl.DEPTH_TEST);     // Enable depth testing
        this.wgl.depthFunc(this.wgl.LEQUAL);      // Near things obscure far things

        //  enable culling (back faces is default)
        this.wgl.enable(this.wgl.CULL_FACE);

        //  clear the canvas before drawing on it
        //  same as with CanvasRenderingContext2D
        this.wgl.clear(this.wgl.COLOR_BUFFER_BIT | this.wgl.DEPTH_BUFFER_BIT);

        //  define the field of view, aspect ratio, and near and far z-bounds
        //  these parameters will be used to calculate elements in a 4x4
        //  projection matrix
        let aspect: number = this.vpSize[0] / this.vpSize[1];
        let zNear: number = 0.1;
        let zFar: number = 100.0;

        //  create a perspective matrix and calculate its elements
        const projectionMatrix: mat4 = mat4.create();
        mat4.perspective(projectionMatrix, this._fov, aspect, zNear, zFar);

        //  create a matrix where the square should be drawn and offset it
        //  slightly from the origin (mat4.create() returns a new 4x4 identity
        //  matrix)
        //  not sure why MDN shows explicit floats or the negative zero?
        const modelViewMatrix: mat4 = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, this._pos);  //  amount to translate
        mat4.rotateX(modelViewMatrix, modelViewMatrix, this._rot[0] * DEG2RAD);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, this._rot[1] * DEG2RAD);
        mat4.scale(modelViewMatrix, modelViewMatrix, this._scale);

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
            //  draw top surface
            //  the offset argument must be a multiple of the size of the data
            //  type in the element array buffer (when using drawElements())
            //  the UNSIGNED SHORT type is 2 bytes
            const SIZEOF_USHORT: number = 2;
            let offset: number = 0;
            let vertexCount: number = 14;
            let type = this.wgl.UNSIGNED_SHORT;
            this.wgl.drawElements(this.wgl.TRIANGLE_FAN, vertexCount, type, offset * SIZEOF_USHORT);

            // draw bottom surface
            offset = 14;
            this.wgl.drawElements(this.wgl.TRIANGLE_FAN, vertexCount, type, offset * SIZEOF_USHORT);
        }

        //  draw the side surfaces as a triangle strip
        {
            const SIZEOF_USHORT: number = 2;
            let offset: number = 28;
            let vertexCount: number = 26;
            let type: GLenum = this.wgl.UNSIGNED_SHORT;
            this.wgl.drawElements(this.wgl.TRIANGLE_STRIP, vertexCount, type, offset * SIZEOF_USHORT);
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
    initBuffers(elements: DataIndex): BufferIndex {

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
        console.debug('final vertices array: %o', elements.position);
        console.debug('final indices array: %o', elements.index);

        //  fill the array buffer with a typed array derived from the positions
        //  array previously defined
        //  indicate that this data will be used unchanged for "many" draw
        //  cycles/commands
        //
        //  note the exceptions that may be thrown: wgl.OUT_OF_MEMORY,
        //  wgl.INVALID_VALUE, & wgl.INVALID_ENUM
        //  see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
        this.wgl.bufferData(this.wgl.ARRAY_BUFFER,
            elements.position,
            this.wgl.STATIC_DRAW);

        //  define color sequences for the top/bottom and side surfaces
        //  top/bottom surfaces drawn with a conic gradient where theta=0 is
        //  black, theta=2pi is white, and the center vertex is black
        //  side vertices alternate between white & black: each pair of top
        //  & bottom vertex is assigned the opposite color as the previous,
        //  with the possible exception of the vertices @ theta=0 in the case
        //  that the number of edges is odd
        const edges = 12;

        //  start with the top surface
        //  center black node & 13 perimeter nodes blended from black to white
        let colors: number[] = [0.0, 0.0, 0.0, 1.0];  // bot/center always blk
        let shade: number;
        //  number of edges + 1 node duplicated (also makes last shade 12/12=1)
        for(let i = 0; i < edges + 1; i++) {
            shade = i / edges;
            colors.push(shade, shade, shade, 1.0);
        }
        //  add another copy of this gradient for the bottom surface
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
            elements.index,
            this.wgl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer
        };
    }
}


export {OrbitView};
