/** this interface assumes that vertices are grouped into triplets to
 * compose triangles */
interface DataIndex {
    vertCount: number,
    indCount: number,
    position: Float32Array,
    color: Float32Array,
    normal: Float32Array,
    index: Uint16Array
}

export {DataIndex};
