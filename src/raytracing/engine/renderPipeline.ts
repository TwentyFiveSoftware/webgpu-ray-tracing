export class RenderPipeline {
    public static initializeRenderPipeline(
        device: GPUDevice,
        canvasFormat: GPUTextureFormat,
        bindGroupLayout: GPUBindGroupLayout,
        vertexShaderCode: string,
        fragmentShaderCode: string,
    ): GPURenderPipeline {
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: 8, // 2 coordinates (x and y) * 4 bytes (byte size of a float32)
            attributes: [{
                format: 'float32x2',
                offset: 0,
                shaderLocation: 0, // @location(0) in vertex shader
            }],
        };

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout], // only one element = only @group(0)
        });

        return device.createRenderPipeline({
            layout: pipelineLayout,
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
}
