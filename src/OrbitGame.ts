//@ts-ignore
import {mat4} from '../ext/gl-matrix/index.js';


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
    position: WebGLBuffer
};

/** vertex shader source code */
const vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;
/** fragment shader source code */
const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
     * this particular implementation of the init() method is based on MDN's
     * WebGL tutorial, and specifically on the section titled 'Adding 2D content
     * to a WebGL context'
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
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
                vertexPosition: this.wgl.getAttribLocation(shader, 'aVertexPosition')
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
        let positionBuffer: BufferIndex;
        try {
            positionBuffer = this.initBuffer();
        }
        catch(er) {
            console.error(`error initializing buffers: ${er.toString()}`);
            return -1;
        }

        //  draw the scene
        this.drawScene(programInfo, positionBuffer);

        return 0;
    }


    /** draw the scene's current state */
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
                        [-0.0, 0.0, -6.0]);  //  amount to translate

        //  describe exactly what the values entered into the array buffer are
        //  (i.e. each "position" defined in initBuffer() is a pair of
        //  32-bit floats)
        //  tell wgl to pull those values out of the array buffer into the
        //  vertexPosition attribute in the vertex shader source (no attributes
        //  declared in the fragment shader but they would be indicated the same
        //  way here)
        //
        //  note the use of curly braces to create an isolated variable scope
        {
            const numComponents: number = 2;        // pull out 2 values per iteration
            const type: number = this.wgl.FLOAT;    // the coordinates are 32bit floats
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

        //  actually draw the square
        //  again note the use of curly braces
        {
            const offset: number = 0;
            const vertexCount: number = 4;
            this.wgl.drawArrays(this.wgl.TRIANGLE_STRIP, offset, vertexCount);
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

    /** initialize and return a buffer for the square's vertices
     * @throws TypeError - wgl.createBuffer returned an invalid buffer */
    initBuffer(): BufferIndex {

        //  create a buffer to store the square's vertex positions
        let positionBuffer: WebGLBuffer | null = this.wgl.createBuffer();
        if(!(positionBuffer instanceof WebGLBuffer)) {
            console.debug('invalid buffer returned from wgl.createBuffer():' +
                ' %o', positionBuffer);
            throw new TypeError(`invalid position buffer`);
        }

        //  this designates 'positionBuffer' as the one to which buffer ops
        //  should be applied
        this.wgl.bindBuffer(this.wgl.ARRAY_BUFFER, positionBuffer);

        //  create an array of coordinates for the square
        let positions: number[] = [
            -1.0,  1.0,
            1.0,  1.0,
            -1.0, -1.0,
            1.0, -1.0,
        ];

        //  fill the array buffer with a typed array derived from the positions
        //  array previously defined
        //  indicate that this data will be used unchanged for "many" draw
        //  cycles/commands
        //
        //  note the exceptions that may be thrown: wgl.OUT_OF_MEMORY,
        //  wgl.INVALID_VALUE, & wgl.INVALID_ENUM
        //  see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
        this.wgl.bufferData(this.wgl.ARRAY_BUFFER,
                            Float32Array.from(positions),
                            this.wgl.STATIC_DRAW);

        return {
            position: positionBuffer
        };
    }
}


export default OrbitGame;
