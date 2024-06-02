import React, { useCallback, useRef, useState } from 'react';
import styles from './App.module.css';
import Settings from '../Settings/Settings.tsx';
import { startRayTracing } from '../../raytracing/renderer.ts';

let renderAbortController = new AbortController();

const App: React.FC = () => {
    const [rendering, setRendering] = useState<boolean>(false);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const render = useCallback((width: number, height: number, samples: number) => {
        if (!canvasRef.current) {
            return;
        }

        setRendering(true);
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
    }, [canvasRef, setRendering, setLogMessages]);

    const isWebGPUSupported = !!navigator.gpu;
    if (!isWebGPUSupported) {
        return (
            <main className={styles.main}>
                <section className={styles.section}>
                    <h1 className={styles.title}>WebGPU not supported on this browser</h1>
                    <p>
                        More information on support/availability of WebGPU and potentially how to enable it can be found
                        at <a href={'https://caniuse.com/webgpu'}>https://caniuse.com/webgpu</a> and{' '}
                        <a href={'https://github.com/gpuweb/gpuweb/wiki/Implementation-Status'}>https://github.com/gpuweb/gpuweb/wiki/Implementation-Status</a>.
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <section className={styles.section}>
                <h1 className={styles.title}>SETTINGS</h1>

                <Settings render={render} />
            </section>

            <canvas ref={canvasRef} className={`${styles.canvas} ${!rendering ? styles.hidden : ''}`} />

            {rendering && (
                <section className={styles.section}>
                    <h1 className={styles.title}>CONSOLE</h1>

                    <pre className={styles.log}>{logMessages}</pre>
                </section>
            )}
        </main>
    );
};

export default App;