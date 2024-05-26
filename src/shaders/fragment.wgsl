struct FragmentInput {
     @location(0) uv: vec2<f32>,
     @builtin(position) fragmentPosition: vec4<f32>,
}

struct FragmentOutput {
     @location(0) pixelColor: vec4<f32>,
}

@group(0) @binding(0) var<uniform> aspectRatio: f32;
@group(0) @binding(1) var<uniform> cameraLookFrom: vec3<f32>;
@group(0) @binding(2) var<uniform> cameraLookAt: vec3<f32>;
@group(0) @binding(3) var<uniform> cameraFov: f32;
@group(0) @binding(4) var<storage, read> scene: Scene;

const MAX_RAY_TRACE_DEPTH: u32 = 50;

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput {
    initRandom(input.fragmentPosition.xy);

    let camera: Camera = newCamera();

    let ray: Ray = getCameraRay(camera, input.uv);
    let pixel_color: vec3<f32> = calculateRayColor(ray);

    var output: FragmentOutput;
    output.pixelColor = vec4<f32>(sqrt(pixel_color), 1);
    return output;
}

fn calculateRayColor(ray: Ray) -> vec3<f32> {
    var reflectedColor: vec3<f32> = vec3<f32>(1);
    var lightSourceColor: vec3<f32> = vec3<f32>(0);

    var currentRay: Ray = ray;

    for (var depth: u32 = 0; depth < MAX_RAY_TRACE_DEPTH; depth++) {
        let hitRecord: HitRecord = rayHitsScene(currentRay);
        if !hitRecord.doesHit {
            let t: f32 = (currentRay.direction.y + 1) / 2;
            lightSourceColor = mix(vec3<f32>(1, 1, 1), vec3<f32>(0.5, 0.7, 1), t);
            break;
        }

        let scatterRecord: ScatterRecord = scatter(hitRecord.material, currentRay, hitRecord);
        if !scatterRecord.doesScatter {
            lightSourceColor = vec3<f32>(0);
            break;
        }

        reflectedColor *= scatterRecord.attenuation;
        currentRay = Ray(hitRecord.hitPoint, scatterRecord.scatterDirection);
    }

    return reflectedColor * lightSourceColor;
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
    material: Material,
};

// ScatterRecord
struct ScatterRecord {
    doesScatter: bool,
    attenuation: vec3<f32>,
    scatterDirection: vec3<f32>,
}

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

    return HitRecord(true, t, hitPoint, hitNormal, isFrontFace, sphere.material);
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
    refractionIndex: f32,
    colors: array<vec3<f32>, 2>,
}

const MATERIAL_TYPE_DIFFUSE = 0;
const MATERIAL_TYPE_METAL = 1;
const MATERIAL_TYPE_DIELECTRIC = 2;

const TEXTURE_TYPE_SOLID = 0;
const TEXTURE_TYPE_CHECKERED = 1;

fn scatter(material: Material, ray: Ray, hitRecord: HitRecord) -> ScatterRecord {
    if material.materialType == MATERIAL_TYPE_DIFFUSE {
        return scatterDiffuseMaterial(material, hitRecord);

    } else if material.materialType == MATERIAL_TYPE_METAL {
        return scatterMetalMaterial(material, ray, hitRecord);

    } else if material.materialType == MATERIAL_TYPE_DIELECTRIC {
        return scatterMetalDielectric(material, ray, hitRecord);
    }

    return ScatterRecord();
}

fn scatterDiffuseMaterial(material: Material, hitRecord: HitRecord) -> ScatterRecord {
    var scatterDirection: vec3<f32> = normalize(hitRecord.hitNormal + randomUnitVec3());
    if isVec3NearZero(scatterDirection) {
        scatterDirection = hitRecord.hitNormal;
    }

    return ScatterRecord(true, getTextureColor(material, hitRecord.hitPoint), scatterDirection);
}

fn scatterMetalMaterial(material: Material, ray: Ray, hitRecord: HitRecord) -> ScatterRecord {
    let scatterDirection: vec3<f32> = reflect(ray.direction, hitRecord.hitNormal);
    if dot(scatterDirection, hitRecord.hitNormal) <= 0 {
        return ScatterRecord();
    }

    return ScatterRecord(true, getTextureColor(material, hitRecord.hitPoint), scatterDirection);
}

fn scatterMetalDielectric(material: Material, ray: Ray, hitRecord: HitRecord) -> ScatterRecord {
    var refractionRatio: f32 = material.refractionIndex;
    if hitRecord.isFrontFace {
        refractionRatio = 1 / material.refractionIndex;
    }

    let scatterDirection: vec3<f32> = refract(ray.direction, hitRecord.hitNormal, refractionRatio);

    return ScatterRecord(true, vec3<f32>(1), scatterDirection);
}

fn getTextureColor(material: Material, pointToSample: vec3<f32>) -> vec3<f32> {
    if material.textureType == TEXTURE_TYPE_SOLID {
        return material.colors[0];

    } else if material.textureType == TEXTURE_TYPE_CHECKERED {
        const size = 6;

        if sin(size * pointToSample.x) * sin(size * pointToSample.y) * sin(size * pointToSample.z) > 0 {
            return material.colors[0];
        } else {
            return material.colors[1];
        }
    }

    return vec3<f32>();
}

// Randomness
var<private> rngSeed: u32;

fn initRandom(fragmentPosition: vec2<f32>) {
    rngSeed = hash(u32(fragmentPosition.x) ^ hash(u32(fragmentPosition.y)));
}

fn random() -> f32 {
    rngSeed = (214013 * rngSeed + 2531011);
    return f32((rngSeed >> 16) & 0x7FFF) / 0x7FFF;
}

fn randomInInterval(min: f32, max: f32) -> f32 {
    return random() * (max - min) + min;
}

fn hash(x: u32) -> u32 {
    var result = x;
    result += (result << 10u);
    result ^= (result >>  6u);
    result += (result <<  3u);
    result ^= (result >> 11u);
    result += (result << 15u);
    return result;
}

// Vec3 Utility
fn randomUnitVec3() -> vec3<f32> {
    loop {
        let pointInUnitCube: vec3<f32> = vec3<f32>(
            randomInInterval(-1, 1),
            randomInInterval(-1, 1),
            randomInInterval(-1, 1),
        );

        if dot(pointInUnitCube, pointInUnitCube) < 1 {
            return normalize(pointInUnitCube);
        }
    }
}

fn isVec3NearZero(v: vec3<f32>) -> bool {
    const epsilon: f32 = 1e-8;
    return abs(v.x) < epsilon && abs(v.y) < epsilon && abs(v.z) < epsilon;
}
