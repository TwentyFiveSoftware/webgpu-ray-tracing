export class Buffer {
    public static USAGE_VERTEX: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    public static USAGE_UNIFORM: GPUBufferUsageFlags = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

    public static initialize(device: GPUDevice, usage: GPUBufferUsageFlags, data: ArrayBuffer): GPUBuffer {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: usage,
        });

        device.queue.writeBuffer(buffer, 0, data);
        return buffer;
    }

    public static initializeRectangleVertexBuffer(device: GPUDevice): GPUBuffer {
        // rectangle with the size same size as the viewport
        const vertices = new Float32Array([
            // triangle 1
            -1, -1,
            1, -1,
            1, 1,

            // triangle 2
            -1, -1,
            1, 1,
            -1, 1,
        ]);

        return Buffer.initialize(device, Buffer.USAGE_VERTEX, vertices);
    };
}
