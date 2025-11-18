/*
struct OurStruct {
    color: vec4f,
    offset: vec2f,
};

struct OtherStruct {
    scale: vec2f,
};

struct VertexStruct {
    @location(0) position : vec2f,
};
*/

struct VertexStruct {
    @location(0) position: vec2f,
    @location(1) color: vec4f,
    @location(2) offset: vec2f,
    @location(3) scale: vec2f,
    @location(4) pervertexColor: vec3f,
}


/*
@group(0)@binding(0) var<storage, read> ourStructs: array<OurStruct>;
@group(0)@binding(1) var<storage, read> otherStructs: array<OtherStruct>;
*/
 /*
struct OurVertexShaderInput {
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32,
};*/

struct OurVertexShaderOutput {
    @builtin(position) position : vec4f,
    @location(0) color: vec4f,
};


@vertex
fn vs(vert: VertexStruct) -> OurVertexShaderOutput 
{
    var vsOut: OurVertexShaderOutput;
    vsOut.position = vec4f(
        vert.position * vert.scale +
        vert.offset, 0.0, 1.0);
    vsOut.color = vert.color * vec4f(vert.pervertexColor, 1.0);

    return vsOut; 
};

@fragment 
fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {

    //let red = vec4f(1, 0, 0, 1);
    //let cyan = vec4f(0, 1, 1, 1);

    //let grid = vec2u(fsInput.position.xy) / 16;

    //let checker = (grid.x + grid.y) % 2 == 1;

    //return vec4f(fsInput.position.x,0.0,0.0,1.0);

    //return select(red, cyan, checker);

    //return fsInput.color;

    return fsInput.color;
};