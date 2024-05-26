export class Scene {
    private readonly spheres: Sphere[];

    constructor(spheres: Sphere[]) {
        this.spheres = spheres;
    }

    public static generateRandomScene(): Scene {
        const spheres: Sphere[] = [
            new Sphere(new Vector3(0, 0, 0), 0.5,
                new Material(0, 0, 0, new Vector3(1, 0, 0), new Vector3(0, 0, 0))),
            new Sphere(new Vector3(0, -1000.5, 0), 1000,
                new Material(0, 0, 0, new Vector3(0.3, 0.3, 0.3), new Vector3(0, 0, 0))),
        ];

        return new Scene(spheres);
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
