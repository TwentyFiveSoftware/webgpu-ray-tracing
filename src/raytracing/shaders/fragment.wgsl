struct RenderCallInfo {
    width: u32,
    height: u32,
    maxRayTraceDepth: u32,
    samplesPerComputePass: u32,
    alreadyComputedSamples: u32,
}

@group(0) @binding(0) var<uniform> renderCallInfo: RenderCallInfo;
@group(0) @binding(1) var<storage, read> pixels: array<vec3<f32>>;

@fragment
fn fragmentMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let pixelArrayIndex: u32 = u32(uv.y * f32(renderCallInfo.height)) * renderCallInfo.width + u32(uv.x * f32(renderCallInfo.width));
    let summedPixelColor: vec3<f32> = pixels[pixelArrayIndex];
    let pixelColor: vec3<f32> = summedPixelColor / f32(renderCallInfo.alreadyComputedSamples);
    return vec4<f32>(sqrt(pixelColor), 1);
}
