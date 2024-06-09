import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import computeShaderCode from './shaders/compute.wgsl?raw';
import { Engine } from './engine/engine.ts';
import { RenderCallInfo, Scene } from './scene.ts';

export const startRayTracing = async (
    canvas: HTMLCanvasElement,
    logMessage: (message: string) => void,
    abortSignal: AbortSignal,
    width: number,
    height: number,
    samplesPerPixel: number,
    samplesPerComputePass: number = 1,
    maxRayTraceDepth: number = 50,
) => {
    const engine = await Engine.initialize(canvas);

    const renderCallInfo = new RenderCallInfo(width, height, maxRayTraceDepth, samplesPerComputePass);

    const renderCallInfoBuffer = engine.initializeBuffer(GPUBufferUsage.UNIFORM, renderCallInfo.serializeToBytes());
    const sceneBuffer = engine.initializeBuffer(GPUBufferUsage.STORAGE, Scene.generateRandomScene().serializeToBytes());

    const pixelBuffers = [
        engine.initializeBuffer(GPUBufferUsage.STORAGE, new Float32Array(width * height * 4)),
        engine.initializeBuffer(GPUBufferUsage.STORAGE, new Float32Array(width * height * 4)),
    ];

    const renderPipelineBindGroupEntries: GPUBindGroupLayoutEntry[] = [
        {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
        },
        {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: 'read-only-storage' },
        },
    ];

    const computePipelineBindGroupEntries: GPUBindGroupLayoutEntry[] = [
        {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' },
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' },
        },
        {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' },
        },
        {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' },
        },
    ];

    const vertexBuffer = engine.initializeBuffer(GPUBufferUsage.VERTEX,
        // rectangle with the size same size as the viewport (coordinates equal clip-space coordinates)
        new Float32Array([
            -1, -1, 1, -1, 1, 1, // triangle 1
            -1, -1, 1, 1, -1, 1, // triangle 2
        ]),
    );

    const renderPipelineBindGroupLayout = engine.createBindGroupLayout(renderPipelineBindGroupEntries);
    const renderPipeline = engine.createRenderPipeline(renderPipelineBindGroupLayout, vertexShaderCode, fragmentShaderCode);
    const renderPassBindGroups = [1, 0].map(bufferIndex => engine.createBindGroup(renderPipelineBindGroupLayout, [
        { binding: 0, resource: { buffer: renderCallInfoBuffer } },
        { binding: 1, resource: { buffer: pixelBuffers[bufferIndex] } },
    ]));

    const computePipelineBindGroupLayout = engine.createBindGroupLayout(computePipelineBindGroupEntries);
    const computePipeline = engine.createComputePipeline(computePipelineBindGroupLayout, computeShaderCode);
    const computePassBindGroups = [[0, 1], [1, 0]].map(([sourceBufferIndex, targetBufferIndex]) =>
        engine.createBindGroup(computePipelineBindGroupLayout, [
            { binding: 0, resource: { buffer: renderCallInfoBuffer } },
            { binding: 1, resource: { buffer: sceneBuffer } },
            { binding: 2, resource: { buffer: pixelBuffers[sourceBufferIndex] } },
            { binding: 3, resource: { buffer: pixelBuffers[targetBufferIndex] } },
        ]));

    const requiredComputePassCount = Math.ceil(samplesPerPixel / samplesPerComputePass);
    let totalComputePassTime = 0;

    for (let i = 1; i <= requiredComputePassCount; ++i) {
        renderCallInfo.incrementAlreadyComputeSamples(samplesPerComputePass);
        engine.updateBufferData(renderCallInfoBuffer, renderCallInfo.serializeToBytes());

        const computePassStartTime: number = Date.now();

        const COMPUTE_PASS_WORKGROUP_SIZE = 8; // has to match the @workgroup_size in compute shader
        await engine.submit(engine.encodeComputePass(computePipeline, computePassBindGroups[i % 2],
            Math.ceil(width / COMPUTE_PASS_WORKGROUP_SIZE), Math.ceil(height / COMPUTE_PASS_WORKGROUP_SIZE)));

        const computePassDuration: number = Date.now() - computePassStartTime;
        totalComputePassTime += computePassDuration;

        logMessage('[' + i.toString().padStart(samplesPerPixel.toString().length, ' ') + `/${requiredComputePassCount} | `
            + (i * 100 / requiredComputePassCount).toFixed(1).padStart(5, ' ') + '%] '
            + `Rendered ${samplesPerComputePass} sample${samplesPerComputePass !== 1 ? 's' : ''}/pixel in ${computePassDuration} ms`);

        // abort before render pass to avoid potential conflicts with new render calls
        if (abortSignal.aborted) {
            return;
        }

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        await engine.submit(engine.encodeRenderPass(renderPipeline, renderPassBindGroups[i % 2], vertexBuffer));
    }

    logMessage(`\n=> Rendered ${width}x${height} image with ${requiredComputePassCount * samplesPerComputePass} samples/pixel ` +
        `in ${totalComputePassTime} ms (mean ${totalComputePassTime / samplesPerPixel} ms / sample)`);
};
