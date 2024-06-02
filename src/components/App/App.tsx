import React, { useCallback, useRef, useState } from 'react';
import styles from './App.module.css';
import Settings from '../Settings/Settings.tsx';
import { startRayTracing } from '../../raytracing/renderer.ts';

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

        startRayTracing(
            canvasRef.current,
            (message: string) => setLogMessages(currentLogMessages => [...currentLogMessages, message + '\n']),
            width,
            height,
            samples,
        ).catch(err => alert(err));
    }, [canvasRef, setRendering, setLogMessages]);

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