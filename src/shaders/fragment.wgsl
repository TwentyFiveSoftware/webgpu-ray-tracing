struct FragmentInput {
     @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
     @location(0) pixelColor: vec4<f32>,
}

@group(0) @binding(0) var<uniform> aspectRatio: f32;
@group(0) @binding(1) var<uniform> cameraLookFrom: vec3<f32>;
@group(0) @binding(2) var<uniform> cameraLookAt: vec3<f32>;
@group(0) @binding(3) var<uniform> cameraFov: f32;

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput {
    let camera: Camera = newCamera();

    let ray: Ray = getCameraRay(camera, input.uv);
    let pixel_color: vec3<f32> = calculateRayColor(ray);

    var output: FragmentOutput;
    output.pixelColor = vec4<f32>(pixel_color, 1);
    return output;
}

fn calculateRayColor(ray: Ray) -> vec3<f32> {
    let t: f32 = 0.5 * (ray.direction.y + 1);
    return mix(vec3<f32>(1, 1, 1), vec3<f32>(0.5, 0.7, 1), t);
}

// Ray
struct Ray {
    origin: vec3<f32>,
    direction: vec3<f32>,
}

fn rayAt(ray: Ray, t: f32) -> vec3<f32> {
    return ray.origin + ray.direction * t;
}

// Camera
struct Camera {
    upperLeftCorner: vec3<f32>,
    horizontalDirection: vec3<f32>,
    verticalDirection: vec3<f32>,
};

fn newCamera() -> Camera {
    let viewportHeight: f32 = tan(radians(cameraFov) / 2) * 2;
    let viewportWidth: f32 = aspectRatio * viewportHeight;

    let forward: vec3<f32> = normalize(cameraLookAt - cameraLookFrom);
    let right: vec3<f32> = normalize(cross(vec3<f32>(0, 1, 0), forward));
    let up: vec3<f32> = normalize(cross(forward, right));

    let horizontalDirection: vec3<f32> = viewportWidth * right;
    let verticalDirection: vec3<f32> = viewportHeight * up;

    let upperLeftCorner: vec3<f32> = cameraLookFrom - horizontalDirection / 2 + verticalDirection / 2 + forward;

    return Camera(upperLeftCorner, horizontalDirection, verticalDirection);
}

fn getCameraRay(camera: Camera, uv: vec2<f32>) -> Ray {
    let to: vec3<f32> = camera.upperLeftCorner + camera.horizontalDirection * uv.x + camera.verticalDirection * uv.y;
    return Ray(cameraLookFrom, normalize(to - cameraLookFrom));
}
