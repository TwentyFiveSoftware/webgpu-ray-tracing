export class ComputePipeline {
    public static initializeComputePipeline(
        device: GPUDevice,
        bindGroupLayout: GPUBindGroupLayout,
        computeShaderCode: string,
    ): GPUComputePipeline {
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout], // only one element = only @group(0)
        });

        return device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: device.createShaderModule({
                    code: computeShaderCode,
                }),
                entryPoint: 'computeMain',
            },
        });
    };
}
