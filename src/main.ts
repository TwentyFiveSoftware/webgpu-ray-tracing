import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import type { ShaderBinding } from './engine/bindGroup.ts';
import { Engine } from './engine/engine.ts';

const canvas = document.querySelector('canvas')!;

const shaderBindings: ShaderBinding[] = [
    // aspectRatio
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        data: new Float32Array([canvas.height / canvas.width]),
    },

    // cameraLookFrom
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        data: new Float32Array([12, 2, -3]),
    },

    // cameraLookAt
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        data: new Float32Array([0, 0, 0]),
    },

    // cameraFov
    {
        shaderStage: GPUShaderStage.FRAGMENT,
        data: new Float32Array([25]),
    },
];

const engine = await Engine.initialize(canvas, vertexShaderCode, fragmentShaderCode, shaderBindings);

const renderLoop = (): void => {
    engine.render();
    // requestAnimationFrame(renderLoop);
};

renderLoop();
