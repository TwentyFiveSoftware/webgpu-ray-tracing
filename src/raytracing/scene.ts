export class Scene {
    private readonly spheres: Sphere[];

    constructor(spheres: Sphere[]) {
        this.spheres = spheres;
    }

    public static generateRandomScene(): Scene {
        const spheres: Sphere[] = [];

        for (let x = -11; x < 11; x++) {
            for (let z = -11; z < 11; z++) {
                let material: Material;

                let materialRandom = Math.random();
                if (materialRandom < 0.8) {
                    material = Material.solidDiffuse(Scene.getRandomColor());
                } else if (materialRandom < 0.95) {
                    material = Material.solidMetal(Scene.getRandomColor());
                } else {
                    material = Material.dielectric(1.5);
                }

                const center: Vector3 = new Vector3(x + Math.random() * 0.9, 0.2, z + Math.random() * 0.9);

                spheres.push(new Sphere(center, 0.2, material));
            }
        }

        // GROUND
        spheres.push(new Sphere(new Vector3(0, -1000, 0), 1000,
            Material.checkeredDiffuse(new Vector3(0.05, 0.05, 0.05), new Vector3(0.95, 0.95, 0.95))));

        // LEFT
        spheres.push(new Sphere(new Vector3(-4, 1, 0), 1, Material.solidDiffuse(new Vector3(0.6, 0.3, 0.1))));

        // CENTER
        spheres.push(new Sphere(new Vector3(0, 1, 0), 1, Material.dielectric(1.5)));

        // RIGHT
        spheres.push(new Sphere(new Vector3(4, 1, 0), 1, Material.solidMetal(new Vector3(0.7, 0.6, 0.5))));

        return new Scene(spheres);
    }

    private static getRandomColor(): Vector3 {
        return Scene.hsvToRgb(Math.random() * 360, 0.75, 0.45);
    }

    private static hsvToRgb(hue: number, s: number, v: number): Vector3 {
        const h: number = hue / 60;
        const fraction: number = h - Math.floor(h);

        const p: number = v * (1 - s);
        const q: number = v * (1 - s * fraction);
        const t: number = v * (1 - s * (1 - fraction));

        if (0 <= h && h < 1) return new Vector3(v, t, p);
        else if (1 <= h && h < 2) return new Vector3(q, v, p);
        else if (2 <= h && h < 3) return new Vector3(p, v, t);
        else if (3 <= h && h < 4) return new Vector3(p, q, v);
        else if (4 <= h && h < 5) return new Vector3(t, p, v);
        else if (5 <= h && h < 6) return new Vector3(v, p, q);

        return new Vector3(0, 0, 0);
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new Uint8Array(this.spheres.length * 64);

        for (let i = 0; i < this.spheres.length; ++i) {
            buffer.set(new Uint8Array(this.spheres[i].serializeToBytes()), i * 64);
        }

        return buffer;
    }
}

class Sphere {
    private readonly center: Vector3;
    private readonly radius: number;
    private readonly material: Material;

    constructor(center: Vector3, radius: number, material: Material) {
        this.center = center;
        this.radius = radius;
        this.material = material;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(64);
        const bufferView = new DataView(buffer);

        new Uint8Array(buffer).set(new Uint8Array(this.center.serializeToBytes()), 0);
        bufferView.setFloat32(12, this.radius, true);
        new Uint8Array(buffer).set(new Uint8Array(this.material.serializeToBytes()), 16);

        return buffer;
    }
}

class Material {
    public static MATERIAL_TYPE_DIFFUSE = 0;
    public static MATERIAL_TYPE_METAL = 1;
    public static MATERIAL_TYPE_DIELECTRIC = 2;

    public static TEXTURE_TYPE_SOLID = 0;
    public static TEXTURE_TYPE_CHECKERED = 1;

    private readonly materialType: number;
    private readonly textureType: number;
    private readonly refractionIndex: number;
    private readonly color1: Vector3;
    private readonly color2: Vector3;

    constructor(materialType: number, textureType: number, refractionIndex: number, color1: Vector3, color2: Vector3) {
        this.materialType = materialType;
        this.textureType = textureType;
        this.refractionIndex = refractionIndex;
        this.color1 = color1;
        this.color2 = color2;
    }

    public static solidDiffuse(color: Vector3): Material {
        return new Material(Material.MATERIAL_TYPE_DIFFUSE, Material.TEXTURE_TYPE_SOLID, 0, color, new Vector3(0, 0, 0));
    }

    public static checkeredDiffuse(color1: Vector3, color2: Vector3): Material {
        return new Material(Material.MATERIAL_TYPE_DIFFUSE, Material.TEXTURE_TYPE_CHECKERED, 0, color1, color2);
    }

    public static solidMetal(color: Vector3): Material {
        return new Material(Material.MATERIAL_TYPE_METAL, Material.MATERIAL_TYPE_DIFFUSE, 0, color, new Vector3(0, 0, 0));
    }

    public static dielectric(refractionIndex: number): Material {
        return new Material(Material.MATERIAL_TYPE_DIELECTRIC, 0, refractionIndex, new Vector3(0, 0, 0), new Vector3(0, 0, 0));
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(44);
        const bufferView = new DataView(buffer);

        bufferView.setUint32(0, this.materialType, true);
        bufferView.setUint32(4, this.textureType, true);
        bufferView.setFloat32(8, this.refractionIndex, true);
        new Uint8Array(buffer).set(new Uint8Array(this.color1.serializeToBytes()), 16);
        new Uint8Array(buffer).set(new Uint8Array(this.color2.serializeToBytes()), 32);

        return buffer;
    }
}

class Vector3 {
    private readonly x: number;
    private readonly y: number;
    private readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(12);
        new Float32Array(buffer).set([this.x, this.y, this.z], 0);
        return buffer;
    }
}

export class RenderCallInfo {
    private readonly width: number;
    private readonly height: number;
    private readonly maxRayTraceDepth: number;
    private readonly samplesPerComputePass: number;
    private alreadyComputedSamples: number = 0;

    constructor(width: number, height: number, maxRayTraceDepth: number, samplesPerComputePass: number, alreadyComputedSample: number = 0) {
        this.width = width;
        this.height = height;
        this.maxRayTraceDepth = maxRayTraceDepth;
        this.samplesPerComputePass = samplesPerComputePass;
        this.alreadyComputedSamples = alreadyComputedSample;
    }

    public incrementAlreadyComputeSamples(increase: number) {
        this.alreadyComputedSamples += increase;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(20);
        new Uint32Array(buffer).set([this.width, this.height, this.maxRayTraceDepth, this.samplesPerComputePass, this.alreadyComputedSamples], 0);
        return buffer;
    }
}
