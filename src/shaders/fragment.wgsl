struct FragmentInput {
     @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
     @location(0) pixel_color: vec4<f32>,
}

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.pixel_color = vec4<f32>(input.uv, 0, 1);
    return output;
}
