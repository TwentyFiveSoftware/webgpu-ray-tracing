import React, { useState } from 'react';
import styles from './Settings.module.css';

const resolutionOptions: number[] = [2160, 1440, 1080, 720, 360]; // height
const sampleOptions: number[] = [1, 10, 100, 1000];

type Props = {
    render: (width: number, height: number, samples: number) => void;
};

const Settings: React.FC<Props> = ({ render }) => {
    const [selectedResolution, setSelectedResolution] = useState<number>(1080);
    const [selectedSamples, setSelectedSamples] = useState<number>(10);

    return (
        <div className={styles.settings}>
            <SettingsGroup
                title={'RESOLUTION'}
                options={resolutionOptions.map(resolutionHeight => ({
                    label: `${resolutionHeight * 16 / 9}x${resolutionHeight}`,
                    isSelected: resolutionHeight == selectedResolution,
                    onClick: () => setSelectedResolution(resolutionHeight),
                }))}
            />

            <SettingsGroup
                title={'SAMPLES / PIXEL'}
                options={sampleOptions.map(samples => ({
                    label: `${samples}`,
                    isSelected: samples == selectedSamples,
                    onClick: () => setSelectedSamples(samples),
                }))}
            />

            <button
                className={`${styles.button} ${styles.renderButton}`}
                onClick={() => render(selectedResolution * 16 / 9, selectedResolution, selectedSamples)}
            >
                RENDER
            </button>
        </div>
    );
};

type SettingsGroupProps = {
    title: string,
    options: {
        label: string,
        onClick: () => void;
        isSelected: boolean;
    }[]
};

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, options }) => {
    return (
        <div className={styles.group}>
            <p className={styles.groupTitle}>{title}</p>
            <div className={styles.groupOptions}>
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={option.onClick}
                        className={`${styles.button} ${option.isSelected ? styles.buttonSelected : ''}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Settings;