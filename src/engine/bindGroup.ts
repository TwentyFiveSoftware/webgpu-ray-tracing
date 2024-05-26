import { Buffer } from './buffer.ts';

export interface ShaderBinding {
    shaderStage: GPUShaderStageFlags,
    data: ArrayBuffer,
}

export class BindGroup {
    public static initializeBindGroupLayout(device: GPUDevice, shaderBindings: ShaderBinding[]) {
        return device.createBindGroupLayout({
            entries: shaderBindings.map<GPUBindGroupLayoutEntry>((binding, index) => ({
                binding: index, // equals to @binding(index) in shader
                visibility: binding.shaderStage,
                buffer: {
                    type: 'uniform',
                },
            })),
        });
    }

    public static initializeBindGroup(device: GPUDevice, bindGroupLayout: GPUBindGroupLayout, shaderBindings: ShaderBinding[]): GPUBindGroup {
        return device.createBindGroup({
            layout: bindGroupLayout,
            entries: shaderBindings.map<GPUBindGroupEntry>((binding, index) => ({
                binding: index, // equals to @binding(index) in shader
                resource: {
                    buffer: Buffer.initialize(device, Buffer.USAGE_UNIFORM, binding.data),
                },
            })),
        });
    };
}
