'use client';

import { useMemo } from 'react';

interface BubbleData {
    size: number;
    left: string;
    duration: string;
    delay: string;
}

export default function BubbleBackground({ count = 12 }: { count?: number }) {
    const bubbles: BubbleData[] = useMemo(
        () =>
            Array.from({ length: count }).map(() => ({
                size: Math.random() * 40 + 10,
                left: Math.random() * 100 + '%',
                duration: Math.random() * 10 + 5 + 's',
                delay: Math.random() * 5 + 's',
            })),
        [count]
    );

    return (
        <>
            {/* Ocean Background */}
            <div className="ocean-bg" id="ocean">
                {/* Light rays */}
                <div
                    className="ray"
                    style={{ left: '20%', width: '150px', animation: 'float 8s infinite alternate' }}
                />
                <div
                    className="ray"
                    style={{ left: '50%', width: '100px', animation: 'float 12s infinite alternate' }}
                />
                <div
                    className="ray"
                    style={{ left: '80%', width: '200px', animation: 'float 10s infinite alternate' }}
                />

                {/* Bubbles */}
                {bubbles.map((b, i) => (
                    <div
                        key={i}
                        className="bubble"
                        style={{
                            width: b.size,
                            height: b.size,
                            left: b.left,
                            animationDuration: b.duration,
                            animationDelay: b.delay,
                        }}
                    />
                ))}
            </div>

            {/* Texture overlay (dot grid pattern) */}
            <div className="texture-overlay" />
        </>
    );
}
