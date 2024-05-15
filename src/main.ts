import vertexShaderCode from './shaders/vertex.wgsl?raw';
import fragmentShaderCode from './shaders/fragment.wgsl?raw';
import { Renderer } from './renderer.ts';

if (!navigator.gpu) {
    throw new Error('WebGPU not supported on this browser.');
}

const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
if (!adapter) {
    throw new Error('No appropriate GPUAdapter found.');
}

console.log('GPU Adapter Info:', await adapter.requestAdapterInfo());

const device = await adapter.requestDevice();

const canvas = document.querySelector('canvas')!;
const canvasContext = canvas.getContext('webgpu')!;
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

canvasContext.configure({
    device: device,
    format: canvasFormat,
});

// ---------------------------------------------------------------------

const renderer = new Renderer(device, canvasContext, canvasFormat, vertexShaderCode, fragmentShaderCode);

const renderLoop = (): void => {
    renderer.render();
    // requestAnimationFrame(renderLoop);
};

renderLoop();
