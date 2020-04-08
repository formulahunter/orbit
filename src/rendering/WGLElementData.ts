/** this interface assumes that vertices are grouped into triplets to
 * compose triangles */
interface WGLElementData {
    vertices: number[],
    colors: number[],
    normals: number[],
    indices: number[]
}

export {WGLElementData};
