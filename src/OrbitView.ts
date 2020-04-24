/** OrbitView class
 *
 * this class defines and configures a WebGL rendering context. it also
 * populates buffers for that context with associated model data distilled from
 * results of calculations in sim()
 *
 * this class may also manage gui features, depending on how they're implemented
 */
class OrbitView {

    /** canvas element */
    private canvas: HTMLCanvasElement;

    /** WebGL rendering context */
    private wgl: WebGLRenderingContext;

    /** construct an OrbitView instance around a given <canvas> element */
    constructor() {

        //  get a webgl rendering context from the html document's <canvas>
        //  element
    }

    /** configure WebGL context & initialize animation loop */
    init(): void {

        //  configure webgl for rendering using available data & resources

        //  initialize animation loop
    }


    /** draw the current scene as calculated by sim() */
    drawScene(): void {

        //  define coordinate transform matrices

        //  load model data into buffers

        //  render buffered data
    }
}


export {OrbitView};
