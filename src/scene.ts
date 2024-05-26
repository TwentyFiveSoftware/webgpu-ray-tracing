export class Scene {
    private readonly spheres: Sphere[];

    constructor(spheres: Sphere[]) {
        this.spheres = spheres;
    }

    public static generateRandomScene(): Scene {
        const spheres: Sphere[] = [
            new Sphere(0, 0, 0, 0.2, new Material(0, new Texture(0, 0, 0))),
        ];

        return new Scene(spheres);
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new Uint8Array(this.spheres.length * 32);

        for (const sphere of this.spheres) {
            buffer.set(new Uint8Array(sphere.serializeToBytes()), 0);
        }

        return buffer;
    }
}

class Sphere {
    private readonly x: number;
    private readonly y: number;
    private readonly z: number;
    private readonly radius: number;
    private readonly material: Material;

    constructor(x: number, y: number, z: number, radius: number, material: Material) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.material = material;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(32);
        const bufferView = new DataView(buffer);

        bufferView.setFloat32(0, this.x, true);
        bufferView.setFloat32(4, this.y, true);
        bufferView.setFloat32(8, this.z, true);
        bufferView.setFloat32(12, this.radius, true);

        new Uint8Array(buffer).set(new Uint8Array(this.material.serializeToBytes()), 16);

        return buffer;
    }
}

class Material {
    private readonly materialType: number;
    private readonly texture: Texture;

    constructor(materialType: number, texture: Texture) {
        this.materialType = materialType;
        this.texture = texture;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(16);
        const bufferView = new DataView(buffer);

        bufferView.setUint32(0, this.materialType, true);

        new Uint8Array(buffer).set(new Uint8Array(this.texture.serializeToBytes()), 4);

        return buffer;
    }
}

class Texture {
    private readonly textureType: number;
    private readonly textureAttribute1: number;
    private readonly textureAttribute2: number;

    constructor(textureType: number, textureAttribute1: number, textureAttribute2: number) {
        this.textureType = textureType;
        this.textureAttribute1 = textureAttribute1;
        this.textureAttribute2 = textureAttribute2;
    }

    public serializeToBytes(): ArrayBuffer {
        const buffer = new ArrayBuffer(12);
        const bufferView = new DataView(buffer);

        bufferView.setUint32(0, this.textureType, true);
        bufferView.setFloat32(4, this.textureAttribute1, true);
        bufferView.setFloat32(8, this.textureAttribute2, true);

        return buffer;
    }
}
