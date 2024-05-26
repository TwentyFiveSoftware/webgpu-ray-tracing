import { BindGroup, ShaderBinding } from './bindGroup.ts';
import { RenderPipeline } from './renderPipeline.ts';
import { Buffer } from './buffer.ts';

export class Engine {
    private readonly device: GPUDevice;
    private readonly canvasContext: GPUCanvasContext;

    private readonly vertexBuffer: GPUBuffer;
    private readonly renderPipeline: GPURenderPipeline;
    private readonly bindGroup: GPUBindGroup;

    public static async initialize(
        canvas: HTMLCanvasElement,
        vertexShaderCode: string,
        fragmentShaderCode: string,
        shaderBindings: ShaderBinding[],
    ): Promise<Engine> {
        const device = await Engine.getGPUDevice();

        const canvasContext = canvas.getContext('webgpu')!;
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        canvasContext.configure({
            device: device,
            format: canvasFormat,
        });

        const vertexBuffer = Buffer.initializeRectangleVertexBuffer(device);

        const bindGroupLayout = BindGroup.initializeBindGroupLayout(device, shaderBindings);
        const bindGroup = BindGroup.initializeBindGroup(device, bindGroupLayout, shaderBindings);
        const renderPipeline = RenderPipeline.initializeRenderPipeline(device, canvasFormat, bindGroupLayout, vertexShaderCode, fragmentShaderCode);

        return new Engine(device, canvasContext, vertexBuffer, renderPipeline, bindGroup);
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

    constructor(
        device: GPUDevice,
        canvasContext: GPUCanvasContext,
        vertexBuffer: GPUBuffer,
        renderPipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
    ) {
        this.device = device;
        this.canvasContext = canvasContext;
        this.vertexBuffer = vertexBuffer;
        this.renderPipeline = renderPipeline;
        this.bindGroup = bindGroup;
    }

    public async render(): Promise<void> {
        const canvasTexture = this.canvasContext.getCurrentTexture();
        const renderPassCommandBuffer = this.encodeRenderPass(canvasTexture);
        this.device.queue.submit([renderPassCommandBuffer]);
        await this.device.queue.onSubmittedWorkDone();
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
        renderPass.setBindGroup(0, this.bindGroup); // index refers to @binding(0) in shader
        renderPass.setVertexBuffer(0, this.vertexBuffer); // slot refers to vertexBufferLayout index in renderPipeline.vertex.buffers
        renderPass.draw(6); // 6 vertex coordinates in vertex buffer

        renderPass.end();

        return commandEncoder.finish();
    }
}
