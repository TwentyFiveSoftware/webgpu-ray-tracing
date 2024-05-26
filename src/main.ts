import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import type { ShaderBinding } from './engine/bindGroup.ts';
import { Engine } from './engine/engine.ts';
import { Scene } from './scene.ts';

const WIDTH = 1920;
const HEIGHT = 1080;
const SAMPLES_PER_PIXEL = 10;

const shaderBindings: ShaderBinding[] = [
    // samplesPerPixel
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Uint32Array([SAMPLES_PER_PIXEL]),
    },

    // aspectRatio
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Float32Array([WIDTH / HEIGHT]),
    },

    // cameraLookFrom
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Float32Array([12, 2, -3]),
    },

    // cameraLookAt
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Float32Array([0, 0, 0]),
    },

    // cameraFov
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Float32Array([25]),
    },

    // scene
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'read-only-storage',
        data: Scene.generateRandomScene().serializeToBytes(),
    },
];

const canvas = document.querySelector('canvas')!;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const engine = await Engine.initialize(canvas, vertexShaderCode, fragmentShaderCode, shaderBindings);

const renderLoop = async (): Promise<void> => {
    const renderStartTime: number = Date.now();

    await engine.render();

    const renderFinishTime: number = Date.now();
    console.log(`rendered ${SAMPLES_PER_PIXEL} samples/pixel in ${renderFinishTime - renderStartTime} ms`);

    // requestAnimationFrame(renderLoop);
};

await renderLoop();
