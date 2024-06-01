import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import computeShaderCode from './shaders/compute.wgsl?raw';
import { Engine } from './engine/engine.ts';
import { Scene, RenderCallInfo } from './scene.ts';


const WIDTH = 800;
const HEIGHT = 450;
const MAX_RAY_TRACE_DEPTH = 50;
const SAMPLES_PER_PIXEL = 100;
const SAMPLES_PER_COMPUTE_PASS = 1;


const canvas = document.querySelector('canvas')!;

const engine = await Engine.initialize(canvas);

const rayTracingTextures = [
    engine.createTexture('rgba32float', WIDTH, HEIGHT, GPUTextureUsage.STORAGE_BINDING),
    engine.createTexture('rgba32float', WIDTH, HEIGHT, GPUTextureUsage.STORAGE_BINDING),
];

const renderCallInfo = new RenderCallInfo(WIDTH, HEIGHT, MAX_RAY_TRACE_DEPTH, SAMPLES_PER_COMPUTE_PASS);

const renderCallInfoBuffer = engine.initializeBuffer(GPUBufferUsage.UNIFORM, renderCallInfo.serializeToBytes());
const sceneBuffer = engine.initializeBuffer(GPUBufferUsage.STORAGE, Scene.generateRandomScene().serializeToBytes());

const renderPipelineBindGroupEntries: GPUBindGroupLayoutEntry[] = [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, storageTexture: { access: 'read-only', format: 'rgba32float' } },
];

const computePipelineBindGroupEntries: GPUBindGroupLayoutEntry[] = [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-only', format: 'rgba32float' } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } },
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
const renderPassBindGroups = [1, 0].map(textureIndex => engine.createBindGroup(renderPipelineBindGroupLayout, [
    { binding: 0, resource: { buffer: renderCallInfoBuffer } },
    { binding: 1, resource: rayTracingTextures[textureIndex].createView() },
]));

const computePipelineBindGroupLayout = engine.createBindGroupLayout(computePipelineBindGroupEntries);
const computePipeline = engine.createComputePipeline(computePipelineBindGroupLayout, computeShaderCode);
const computePassBindGroups = [[0, 1], [1, 0]].map(([sourceTextureIndex, targetTextureIndex]) =>
    engine.createBindGroup(computePipelineBindGroupLayout, [
        { binding: 0, resource: { buffer: renderCallInfoBuffer } },
        { binding: 1, resource: { buffer: sceneBuffer } },
        { binding: 2, resource: rayTracingTextures[sourceTextureIndex].createView() },
        { binding: 3, resource: rayTracingTextures[targetTextureIndex].createView() },
    ]));

const requiredComputePassCount = Math.ceil(SAMPLES_PER_PIXEL / SAMPLES_PER_COMPUTE_PASS);
let totalComputePassTime = 0;

for (let i = 0; i < requiredComputePassCount; ++i) {
    renderCallInfo.incrementAlreadyComputeSamples(SAMPLES_PER_COMPUTE_PASS);
    engine.updateBufferData(renderCallInfoBuffer, renderCallInfo.serializeToBytes());

    const computePassStartTime: number = Date.now();

    const COMPUTE_PASS_WORKGROUP_SIZE = 2; // has no match the @workgroup_size in compute shader
    await engine.submit(engine.encodeComputePass(computePipeline, computePassBindGroups[i % 2], Math.ceil(WIDTH / COMPUTE_PASS_WORKGROUP_SIZE), Math.ceil(HEIGHT / COMPUTE_PASS_WORKGROUP_SIZE)));

    const computePassDuration: number = Date.now() - computePassStartTime;
    totalComputePassTime += computePassDuration;
    console.log(`[${i + 1} / ${requiredComputePassCount}] rendered ${SAMPLES_PER_COMPUTE_PASS} samples/pixel in ${computePassDuration} ms`);

    await engine.submit(engine.encodeRenderPass(renderPipeline, renderPassBindGroups[i % 2], vertexBuffer));
}

console.log(`rendered ${requiredComputePassCount * SAMPLES_PER_COMPUTE_PASS} samples/pixel in ${totalComputePassTime} ms`);
