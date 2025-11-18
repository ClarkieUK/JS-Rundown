struct vertexInput {
    @location(0) position : vec2f,
    @location(1) color : vec3f,
};

struct vertexOutput {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f,
};

@vertex
fn vs(input: vertexInput) -> vertexOutput 
{
    var output: vertexOutput;

    output.position = vec4f(input.position,0.0,1.0);
    output.color = vec4f(input.color,1.0);

    return output;
};

@fragment 
fn fs(fsInput: vertexOutput) -> @location(0) vec4f {

    return fsInput.color;
};