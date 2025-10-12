import React, { useCallback, useRef, useState } from 'react';
import { Settings } from './Settings.tsx';
import { startRayTracing } from '@/raytracing/renderer.ts';
import { cn } from '@/lib/utils.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

let renderAbortController = new AbortController();

export const App: React.FC = () => {
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const render = useCallback((width: number, height: number, samples: number) => {
        if (!canvasRef.current) {
            return;
        }

        setIsRendering(true);
        setLogMessages([]);

        renderAbortController.abort();
        renderAbortController = new AbortController();

        startRayTracing(
            canvasRef.current,
            (message: string) => setLogMessages(currentLogMessages => [...currentLogMessages, message + '\n']),
            renderAbortController.signal,
            width,
            height,
            samples,
        ).catch(err => alert(err));
    }, [canvasRef, setIsRendering, setLogMessages]);

    const isWebGPUSupported = !!navigator.gpu;
    if (!isWebGPUSupported) {
        return (
            <div className="bg-muted flex min-h-svh items-center justify-center p-6 w-full">
                <Card className="max-w-[850px]">
                    <CardHeader>
                        <CardTitle className="text-xl">WebGPU is not supported on this browser!</CardTitle>
                    </CardHeader>
                    <CardContent className="whitespace-wrap break-all">
                        More information on support/availability of WebGPU and potentially how to enable it can be found
                        at {}
                        <a
                            className="underline"
                            href="https://caniuse.com/webgpu"
                        >
                            https://caniuse.com/webgpu
                        </a>
                        {} and {}
                        <a
                            className="underline"
                            href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"
                        >
                            https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
                        </a>
                        .
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-muted flex flex-col min-h-svh items-center justify-center gap-6 p-6 w-full">
            {!isRendering && <Settings render={render} />}

            <canvas ref={canvasRef} className={
                cn('w-full h-auto bg-card aspect-video rounded-xl max-w-[1200px]', !isRendering ? 'hidden' : '')
            } />

            {isRendering && (
                <Card className="w-full max-w-[1200px]">
                    <CardHeader>
                        <CardTitle className="text-xl">Console</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre
                            className="h-[250px] whitespace-pre-wrap flex flex-col-reverse overflow-y-auto"
                        >
                            {logMessages}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
