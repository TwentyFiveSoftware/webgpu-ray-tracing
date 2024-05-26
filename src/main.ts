import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import computeShaderCode from './shaders/compute.wgsl?raw';
import { ShaderBinding } from './engine/bindGroup.ts';
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

const buildRenderPipelineShaderBindings = (rayTracingTexture: GPUTexture): ShaderBinding[] => {
    return [
        {
            bindingIndex: 0,
            shaderStage: GPUShaderStage.FRAGMENT,
            type: 'buffer',
            buffer: {
                buffer: renderCallInfoBuffer,
                bindingType: 'uniform',
            },
        },
        {
            bindingIndex: 1,
            shaderStage: GPUShaderStage.FRAGMENT,
            type: 'storageTexture',
            storageTexture: {
                texture: rayTracingTexture,
                access: 'read-only',
            },
        },
    ];
};

const buildComputePipelineShaderBindings = (sourceRayTracingTexture: GPUTexture, targetRayTracingTexture: GPUTexture): ShaderBinding[] => {
    return [
        {
            bindingIndex: 0,
            shaderStage: GPUShaderStage.COMPUTE,
            type: 'buffer',
            buffer: {
                buffer: renderCallInfoBuffer,
                bindingType: 'uniform',
            },
        },
        {
            bindingIndex: 1,
            shaderStage: GPUShaderStage.COMPUTE,
            type: 'buffer',
            buffer: {
                buffer: sceneBuffer,
                bindingType: 'read-only-storage',
            },
        },
        {
            bindingIndex: 2,
            shaderStage: GPUShaderStage.COMPUTE,
            type: 'storageTexture',
            storageTexture: {
                texture: sourceRayTracingTexture,
                access: 'read-only',
            },
        },
        {
            bindingIndex: 3,
            shaderStage: GPUShaderStage.COMPUTE,
            type: 'storageTexture',
            storageTexture: {
                texture: targetRayTracingTexture,
                access: 'write-only',
            },
        },
    ];
};

const vertexBuffer = engine.initializeBuffer(GPUBufferUsage.VERTEX,
    // rectangle with the size same size as the viewport
    new Float32Array([
        // triangle 1
        -1, -1,
        1, -1,
        1, 1,

        // triangle 2
        -1, -1,
        1, 1,
        -1, 1,
    ]),
);

const renderPipelineBindGroupLayout = engine.initializeBindGroupLayout(buildRenderPipelineShaderBindings(rayTracingTextures[0]));
const renderPipeline = engine.initializeRenderPipeline(renderPipelineBindGroupLayout, vertexShaderCode, fragmentShaderCode);
const renderPassBindGroups = [
    engine.initializeBindGroup(buildRenderPipelineShaderBindings(rayTracingTextures[1]), renderPipelineBindGroupLayout),
    engine.initializeBindGroup(buildRenderPipelineShaderBindings(rayTracingTextures[0]), renderPipelineBindGroupLayout),
];

const computePipelineBindGroupLayout = engine.initializeBindGroupLayout(buildComputePipelineShaderBindings(rayTracingTextures[0], rayTracingTextures[1]));
const computePipeline = engine.initializeComputePipeline(computePipelineBindGroupLayout, computeShaderCode);
const computePassBindGroups = [
    engine.initializeBindGroup(buildComputePipelineShaderBindings(rayTracingTextures[0], rayTracingTextures[1]), computePipelineBindGroupLayout),
    engine.initializeBindGroup(buildComputePipelineShaderBindings(rayTracingTextures[1], rayTracingTextures[0]), computePipelineBindGroupLayout),
];


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
