export class Renderer {
    private readonly device: GPUDevice;
    private readonly canvasContext: GPUCanvasContext;
    private readonly vertexBuffer: GPUBuffer;
    private readonly renderPipeline: GPURenderPipeline;

    constructor(device: GPUDevice, canvasContext: GPUCanvasContext, canvasFormat: GPUTextureFormat, vertexShaderCode: string, fragmentShaderCode: string) {
        this.device = device;
        this.canvasContext = canvasContext;
        this.vertexBuffer = Renderer.initializeVertexBuffer(device);
        this.renderPipeline = Renderer.initializeRenderPipeline(device, canvasFormat, vertexShaderCode, fragmentShaderCode);
    }

    public render(): void {
        const canvasTexture = this.canvasContext.getCurrentTexture();
        const renderPassCommandBuffer = this.encodeRenderPass(canvasTexture);
        this.device.queue.submit([renderPassCommandBuffer]);
    }

    private encodeRenderPass(canvasTexture: GPUTexture): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: canvasTexture.createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 1, g: 1, b: 1, a: 1 },
                },
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setVertexBuffer(0, this.vertexBuffer); // slot refers to vertexBufferLayout index in renderPipeline.vertex.buffers
        renderPass.draw(6);

        renderPass.end();

        return commandEncoder.finish();
    }

    private static initializeRenderPipeline(device: GPUDevice, canvasFormat: GPUTextureFormat, vertexShaderCode: string, fragmentShaderCode: string): GPURenderPipeline {
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: 8, // 2 coordinates (x and y) * 4 bytes (byte size of a float32)
            attributes: [{
                format: 'float32x2',
                offset: 0,
                shaderLocation: 0, // @location(0) in vertex shader
            }],
        };

        return device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({
                    code: vertexShaderCode,
                }),
                entryPoint: 'vertexMain',
                buffers: [vertexBufferLayout],
            },
            fragment: {
                module: device.createShaderModule({
                    code: fragmentShaderCode,
                }),
                entryPoint: 'fragmentMain',
                targets: [{
                    format: canvasFormat,
                }],
            },
        });
    };

    private static initializeVertexBuffer(device: GPUDevice): GPUBuffer {
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

        const vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(vertexBuffer, 0, vertices);

        return vertexBuffer;
    };
}
