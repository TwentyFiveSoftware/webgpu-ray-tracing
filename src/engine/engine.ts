import { RenderPipeline } from './renderPipeline.ts';
import { ComputePipeline } from './computePipeline.ts';
import { BindGroup, ShaderBinding } from './bindGroup.ts';

export class Engine {
    private readonly device: GPUDevice;
    private readonly canvasContext: GPUCanvasContext;
    private readonly canvasFormat: GPUTextureFormat;

    public static async initialize(canvas: HTMLCanvasElement): Promise<Engine> {
        const device = await Engine.getGPUDevice();

        const canvasContext = canvas.getContext('webgpu')!;
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        canvasContext.configure({
            device: device,
            format: canvasFormat,
        });

        return new Engine(device, canvasContext, canvasFormat);
    }

    private static async getGPUDevice(): Promise<GPUDevice> {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported on this browser.');
        }

        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!adapter) {
            throw new Error('No appropriate GPUAdapter found.');
        }

        console.log('GPU Adapter Info:', await adapter.requestAdapterInfo());

        return await adapter.requestDevice();
    }

    constructor(device: GPUDevice, canvasContext: GPUCanvasContext, canvasFormat: GPUTextureFormat) {
        this.device = device;
        this.canvasContext = canvasContext;
        this.canvasFormat = canvasFormat;
    }

    public async submit(commandBuffer: GPUCommandBuffer): Promise<void> {
        this.device.queue.submit([commandBuffer]);
        await this.device.queue.onSubmittedWorkDone();
    }

    public encodeRenderPass(pipeline: GPURenderPipeline, bindGroup: GPUBindGroup, vertexBuffer: GPUBuffer): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.canvasContext.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 1, g: 1, b: 1, a: 1 },
                },
            ],
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup); // index refers to @binding(0) in shader
        renderPass.setVertexBuffer(0, vertexBuffer); // slot refers to vertexBufferLayout index in renderPipeline.vertex.buffers
        renderPass.draw(6); // 6 vertex coordinates in vertex buffer
        renderPass.end();

        return commandEncoder.finish();
    }

    public encodeComputePass(computePipeline: GPUComputePipeline, bindGroup: GPUBindGroup, workGroupCountX: number, workGroupCountY: number): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass({});

        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, bindGroup); // index refers to @binding(0) in shader
        computePass.dispatchWorkgroups(workGroupCountX, workGroupCountY);
        computePass.end();

        return commandEncoder.finish();
    }

    public createTexture(format: GPUTextureFormat, width: number, height: number, usage: GPUTextureUsageFlags): GPUTexture {
        return this.device.createTexture({
            dimension: '2d',
            format: format,
            size: {
                width: width,
                height: height,
            },
            usage: usage,
        });
    }

    public initializeBuffer(usage: GPUBufferUsageFlags, data: ArrayBuffer): GPUBuffer {
        const buffer = this.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | usage,
        });

        this.updateBufferData(buffer, data);
        return buffer;
    }

    public updateBufferData(buffer: GPUBuffer, data: ArrayBuffer) {
        this.device.queue.writeBuffer(buffer, 0, data);
    }

    public initializeRenderPipeline(bindGroupLayout: GPUBindGroupLayout, vertexShaderCode: string, fragmentShaderCode: string): GPURenderPipeline {
        return RenderPipeline.initializeRenderPipeline(this.device, this.canvasFormat, bindGroupLayout, vertexShaderCode, fragmentShaderCode);
    }

    public initializeComputePipeline(bindGroupLayout: GPUBindGroupLayout, computeShaderCode: string): GPUComputePipeline {
        return ComputePipeline.initializeComputePipeline(this.device, bindGroupLayout, computeShaderCode);
    }

    public initializeBindGroupLayout(shaderBindings: ShaderBinding[]): GPUBindGroupLayout {
        return BindGroup.initializeBindGroupLayout(this.device, shaderBindings);
    }

    public initializeBindGroup(shaderBindings: ShaderBinding[], bindGroupLayout: GPUBindGroupLayout): GPUBindGroup {
        return BindGroup.initializeBindGroup(this.device, shaderBindings, bindGroupLayout);
    }
}
