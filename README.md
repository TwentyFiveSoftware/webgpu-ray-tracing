# Ray Tracing

<img src="https://github.com/TwentyFiveSoftware/ray-tracing-gpu/blob/master/sceneRender.png">

## Overview

This is my take on [Peter Shirley's Ray Tracing in One Weekend](https://github.com/RayTracing/raytracing.github.io) book.

This project leverages [WebGPU](https://www.w3.org/TR/webgpu/), a cutting-edge API designed to unlock the full potential of GPU hardware on the web.
Unlike its predecessor, WebGL, which targets OpenGL ES, WebGPU efficiently maps to modern GPU APIs such as Vulkan, DirectX 12, and Metal, providing enhanced performance and capabilities.

The ray tracing computations are performed within a compute shader, which is executed massively in parallel on the GPU.
The intermediate result after each sample is rendered onto a canvas in the browser, allowing you to observe the rendering progress in real time.


## Build & Run this project

A built version of this project is hosted at [https://twentyfivesoftware.github.io/webgpu-ray-tracing/](https://twentyfivesoftware.github.io/webgpu-ray-tracing/).

However, if you want to build this project yourself, execute the following steps:

1. Install [Node.js](https://nodejs.org/en/download)
2. Clone the repository
3. Install dependencies
   ```sh
   npm install
   ```
4. Run the project
   ```sh
   npm run dev
   ```

## Performance

I've already implemented Peter Shirley's ray tracing in various programming languages running on CPU & GPU and compared their performance.

The performance was measured on the same scene (see image above) with the same amount of objects, the same recursive
depth, the same resolution (1920 x 1080). The measured times are averaged over multiple runs.

*Reference system: AMD Ryzen 9 5900X (12 Cores / 24 Threads) | AMD Radeon RX 6800 XT*

|                                                                                                             | 1 sample / pixel | 100 samples / pixel | 
|-------------------------------------------------------------------------------------------------------------|-----------------:|--------------------:|
| [Elixir](https://github.com/TwentyFiveSoftware/elixir-ray-tracing)                                          |        67,200 ms |                 N/A |
| [JavaScript - Node.js](https://github.com/TwentyFiveSoftware/javascript-ray-tracing)                        |         4,870 ms |               308 s |
| [Go](https://github.com/TwentyFiveSoftware/go-ray-tracing)                                                  |         1,410 ms |               142 s |
| [OCaml](https://github.com/TwentyFiveSoftware/ocaml-ray-tracing)                                            |           795 ms |                75 s |
| [Java](https://github.com/TwentyFiveSoftware/java-ray-tracing)                                              |           770 ms |                59 s |
| [C++](https://github.com/TwentyFiveSoftware/ray-tracing)                                                    |           685 ms |                70 s |
| [Rust](https://github.com/TwentyFiveSoftware/rust-ray-tracing)                                              |           362 ms |                36 s |
| [C](https://github.com/TwentyFiveSoftware/c-ray-tracing)                                                    |           329 ms |                33 s |
| [WebGPU](https://github.com/TwentyFiveSoftware/webgpu-ray-tracing)                                          |            33 ms |                 3 s |
| [GPU (Vulkan) - Compute Shader](https://github.com/TwentyFiveSoftware/ray-tracing-gpu)                      |            21 ms |                 2 s |
| [GPU (Vulkan) - Vulkan Ray Tracing Extension](https://github.com/TwentyFiveSoftware/ray-tracing-gpu-vulkan) |             1 ms |               0.1 s |
