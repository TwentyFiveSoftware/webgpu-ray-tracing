export {};

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
const context = canvas.getContext('webgpu')!;
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
});

//

const commandEncoder = device.createCommandEncoder();

const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
        {
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 1, g: 1, b: 1, a: 1 },
        },
    ],
});
renderPass.end();

const commandBuffer = commandEncoder.finish();

device.queue.submit([commandBuffer]);
