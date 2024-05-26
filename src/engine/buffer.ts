export class Buffer {
    public static initialize(device: GPUDevice, usage: GPUBufferUsageFlags, data: ArrayBuffer): GPUBuffer {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | usage,
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

        return Buffer.initialize(device, GPUBufferUsage.VERTEX, vertices);
    };
}
