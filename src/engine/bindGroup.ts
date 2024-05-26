export interface ShaderBinding {
    bindingIndex: number;
    shaderStage: GPUShaderStageFlags;
    type: 'buffer' | 'storageTexture',
    buffer?: {
        bindingType: GPUBufferBindingType;
        buffer: GPUBuffer;
    };
    storageTexture?: {
        texture: GPUTexture;
        access: GPUStorageTextureAccess;
    }
}

export class BindGroup {
    public static initializeBindGroupLayout(device: GPUDevice, shaderBindings: ShaderBinding[]) {
        return device.createBindGroupLayout({
            entries: shaderBindings.map<GPUBindGroupLayoutEntry>(binding => {
                const entry: GPUBindGroupLayoutEntry = {
                    binding: binding.bindingIndex,
                    visibility: binding.shaderStage,
                };

                switch (binding.type) {
                    case 'buffer':
                        entry.buffer = {
                            type: binding.buffer!.bindingType,
                        };
                        break;

                    case 'storageTexture':
                        entry.storageTexture = {
                            format: binding.storageTexture!.texture.format,
                            access: binding.storageTexture!.access,
                            viewDimension: '2d',
                        };
                        break;
                }

                return entry;
            }),
        });
    }

    public static initializeBindGroup(device: GPUDevice, shaderBindings: ShaderBinding[], bindGroupLayout: GPUBindGroupLayout): GPUBindGroup {
        return device.createBindGroup({
            layout: bindGroupLayout,
            entries: shaderBindings.map<GPUBindGroupEntry>(binding => {
                switch (binding.type) {
                    case 'buffer':
                        return {
                            binding: binding.bindingIndex,
                            resource: {
                                buffer: binding.buffer!.buffer,
                            },
                        };

                    case 'storageTexture':
                        return {
                            binding: binding.bindingIndex,
                            resource: binding.storageTexture!.texture.createView({}),
                        };
                }
            }),
        });
    };
}
