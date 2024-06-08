import { RenderPipeline } from './renderPipeline.ts';
import { ComputePipeline } from './computePipeline.ts';

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
            throw new Error('WebGPU not supported on this browser');
        }

        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!adapter) {
            throw new Error('No appropriate GPUAdapter found (probably WebGPU is disabled)');
        }

        console.log((await adapter.requestAdapterInfo()));
        console.log(adapter);
        console.log(adapter.limits);
        console.log([...adapter.features]);

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

    public createRenderPipeline(bindGroupLayout: GPUBindGroupLayout, vertexShaderCode: string, fragmentShaderCode: string): GPURenderPipeline {
        return RenderPipeline.initializeRenderPipeline(this.device, this.canvasFormat, bindGroupLayout, vertexShaderCode, fragmentShaderCode);
    }

    public createComputePipeline(bindGroupLayout: GPUBindGroupLayout, computeShaderCode: string): GPUComputePipeline {
        return ComputePipeline.initializeComputePipeline(this.device, bindGroupLayout, computeShaderCode);
    }

    public createBindGroupLayout(entries: GPUBindGroupLayoutEntry[]): GPUBindGroupLayout {
        return this.device.createBindGroupLayout({ entries });
    }

    public createBindGroup(layout: GPUBindGroupLayout, entries: GPUBindGroupEntry[]): GPUBindGroup {
        return this.device.createBindGroup({ layout, entries });
    }
}
