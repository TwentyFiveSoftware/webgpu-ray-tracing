struct RenderCallInfo {
    width: u32,
    height: u32,
    maxRayTraceDepth: u32,
    samplesPerComputePass: u32,
    alreadyComputedSamples: u32,
}

@group(0) @binding(0) var<uniform> renderCallInfo: RenderCallInfo;
@group(0) @binding(1) var rayTracedTexture: texture_storage_2d<rgba32float, read>;

@fragment
fn fragmentMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let summedPixelColor: vec4<f32> = textureLoad(rayTracedTexture, vec2<u32>(
        u32(uv.x * f32(renderCallInfo.width)),
        u32(uv.y * f32(renderCallInfo.height)),
    ));

    let pixelColor: vec3<f32> = summedPixelColor.xyz / f32(renderCallInfo.alreadyComputedSamples);
    return vec4<f32>(sqrt(pixelColor), 1);
}
