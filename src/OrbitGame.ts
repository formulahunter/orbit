

type ShaderProgramInfo = {
    program: WebGLProgram,
    attributes: {
        [atr: string]: GLint
    },
    uniforms: {
        [uni: string]: WebGLUniformLocation | null
    }
};

//  define the vertex & fragment shaders by their source code
const vsSource = `
            attribute vec4 aVertexPosition;
        
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
        
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            }
        `;
const fsSource = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
        `;

class OrbitGame {

    private canvas: HTMLCanvasElement;

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

        //  set the clear color and clear the canvas
        this.wgl.clearColor(0, 0, 0, 1);
        this.wgl.clear(this.wgl.COLOR_BUFFER_BIT);

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

        return 0;
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
            alert('Unable to initialize the shader program: ' + this.wgl.getProgramInfoLog(program));
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
}


export default OrbitGame;
