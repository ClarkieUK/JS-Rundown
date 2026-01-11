struct StaticStructs {
    color: vec4f, // floats are 32 bit 
    offset: vec2f, // notice how its 0mod8
    _padding: vec2f,
}

struct DynamicStructs {
    scale: vec2f,
    _padding: vec2f,
}

struct Vertex {
    @location(0) position: vec2f,
}

@group(0) @binding(0) var<storage, read> staticStructs: array<StaticStructs>;
@group(0) @binding(1) var<storage, read> dynamicStructs: array<DynamicStructs>;

//struct ourVsInput {
//    @builtin(vertex_index) vertexIndex : u32,
//    @builtin(instance_index) instanceIndex : u32
//}

struct ourVsOutput {
    @builtin(position) position: vec4f,
    @location(0) color : vec4f,
}

@vertex fn vs(vert: Vertex, @builtin(instance_index) instanceIndex : u32) -> ourVsOutput {

    let pos = array(
        vec2f(-0.0, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, -0.5)
    );
    
    let staticStruct = staticStructs[instanceIndex];
    let dynamicStruct = dynamicStructs[instanceIndex];

    var output: ourVsOutput;
    output.position = vec4f(
        vert.position * dynamicStruct.scale + staticStruct.offset, 0.0, 1.0);
    output.color = staticStruct.color;
    return output;
}

@fragment fn fs(fsInput: ourVsOutput) -> @location(0) vec4f {
    
    return fsInput.color;

}