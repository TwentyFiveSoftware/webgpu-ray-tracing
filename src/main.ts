import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import type { ShaderBinding } from './engine/bindGroup.ts';
import { Engine } from './engine/engine.ts';
import { Scene } from './scene.ts';

const canvas = document.querySelector('canvas')!;

const shaderBindings: ShaderBinding[] = [
    // aspectRatio
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        data: new Float32Array([canvas.width / canvas.height]),
    },

    // cameraLookFrom
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        type: 'uniform',
        // data: new Float32Array([12, 2, -3]),
        data: new Float32Array([0, 0, -4]),
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

const engine = await Engine.initialize(canvas, vertexShaderCode, fragmentShaderCode, shaderBindings);

const renderLoop = (): void => {
    engine.render();
    // requestAnimationFrame(renderLoop);
};

renderLoop();
