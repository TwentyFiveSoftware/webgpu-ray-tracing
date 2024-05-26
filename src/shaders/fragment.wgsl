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
@group(0) @binding(4) var<storage, read> scene: Scene;

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
    let hitRecord: HitRecord = rayHitsScene(ray);
    if !hitRecord.doesHit {
        let t: f32 = (ray.direction.y + 1) / 2;
        return mix(vec3<f32>(1, 1, 1), vec3<f32>(0.5, 0.7, 1), t);
    }

    return (hitRecord.hitNormal + 1) / 2;
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
    let to: vec3<f32> = camera.upperLeftCorner + camera.horizontalDirection * uv.x - camera.verticalDirection * uv.y;
    return Ray(cameraLookFrom, normalize(to - cameraLookFrom));
}

// HitRecord
struct HitRecord {
    doesHit: bool,
    rayT: f32,
    hitPoint: vec3<f32>,
    hitNormal: vec3<f32>,
    isFrontFace: bool,
};

// Sphere
struct Sphere {
    center: vec3<f32>,
    radius: f32,
    material: Material,
};

fn rayHitsSphere(sphere: Sphere, ray: Ray, tMin: f32, tMax: f32) -> HitRecord {
    let oc: vec3<f32> = ray.origin - sphere.center;
    let a: f32 = dot(ray.direction, ray.direction);
    let halfB: f32 = dot(oc, ray.direction);
    let c: f32 = dot(oc, oc) - sphere.radius * sphere.radius;
    let discriminant: f32 = halfB * halfB - a * c;

    if discriminant < 0 {
        return HitRecord();
    }

    let sqrtD: f32 = sqrt(discriminant);

    var t: f32 = (-halfB - sqrtD) / a;
    if t < tMin || t > tMax {
        t = (-halfB + sqrtD) / a;

        if t < tMin || t > tMax {
            return HitRecord();
        }
    }

    let hitPoint: vec3<f32> = rayAt(ray, t);
    var hitNormal: vec3<f32> = (hitPoint - sphere.center) / sphere.radius;
    let isFrontFace: bool = dot(ray.direction, hitNormal) < 0;

    if !isFrontFace {
        hitNormal = -hitNormal;
    }

    return HitRecord(true, t, hitPoint, hitNormal, isFrontFace);
}

// Scene
struct Scene {
    spheres: array<Sphere>,
}

fn rayHitsScene(ray: Ray) -> HitRecord {
    var currentHitRecord: HitRecord = HitRecord();
    var maxT: f32 = 0x1p+127f;

    let sphereCount: u32 = arrayLength(&scene.spheres);
    for (var i: u32 = 0; i < sphereCount; i++) {
        let hitRecord: HitRecord = rayHitsSphere(scene.spheres[i], ray, 0.001, maxT);
        if hitRecord.doesHit {
            currentHitRecord = hitRecord;
            maxT = hitRecord.rayT;
        }
    }

    return currentHitRecord;
}

// Material
struct Material {
    materialType: u32,
    textureType: u32,
    textureAttributes: vec2<f32>,
}
