/** Vertex winding enumeration
 *
 * Winding determines whether an element is front- or rear-facing, which in turn
 * determines whether or not it will be "culled" by the vertex shader
 *
 * https://www.khronos.org/registry/webgl/specs/latest/1.0/#WebGLRenderingContextBase
 */
const enum VertexWinding {
    CW      = 0x0900,
    CCW     = 0x0901
}



export {VertexWinding};
