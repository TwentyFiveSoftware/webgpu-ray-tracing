struct VertexInput {
    @location(0) vertex_position: vec2<f32>,
}

struct VertexOutput {
     @builtin(position) position: vec4<f32>,
     @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.vertex_position, 0, 1);
    output.uv = vec2<f32>(input.vertex_position.x + 1, -input.vertex_position.y + 1) / 2;
    return output;
}
