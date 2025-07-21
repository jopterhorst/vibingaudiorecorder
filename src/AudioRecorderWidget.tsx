// Minimal type declarations for Mendix globals
declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mx: any;
    interface Window {
        mx: any;
    }
}

import { ReactElement, createElement, useRef, useState, useEffect } from "react";
import fixWebmDuration from "webm-duration-fix";
import audioBufferToWav from "audiobuffer-to-wav";
import { AudioRecorderWidgetContainerProps } from "../typings/AudioRecorderWidgetProps";
import "./ui/AudioRecorderWidget.css";

// Debug logging helper - only logs in development
const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log(`[AudioRecorder] ${message}`, ...args);
    }
};

// Color utility functions for waveform styling
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const generateWaveformColors = (baseColor: string) => {
    const rgb = hexToRgb(baseColor);
    if (!rgb) {
        // Fallback to default colors if invalid hex
        return {
            inactive: "rgba(255, 255, 255, 0.4)",
            active: "linear-gradient(to top, #00ff88, #00cc6a)",
            glow: "rgba(0, 255, 136, 0.6)"
        };
    }

    const { r, g, b } = rgb;
    
    // Create gradient colors by adjusting brightness
    const lighterR = Math.min(255, Math.floor(r * 1.3));
    const lighterG = Math.min(255, Math.floor(g * 1.3));
    const lighterB = Math.min(255, Math.floor(b * 1.3));
    
    return {
        inactive: `rgba(${r}, ${g}, ${b}, 0.4)`,
        active: `linear-gradient(to top, ${baseColor}, rgb(${lighterR}, ${lighterG}, ${lighterB}))`,
        glow: `rgba(${r}, ${g}, ${b}, 0.6)`
    };
};

export function AudioRecorderWidget(props: AudioRecorderWidgetContainerProps): ReactElement {
    const { 
        audioContentAttribute, 
        onChangeAction,
        readyText,
        recordingText,
        processingText,
        completedText,
        maxRecordingMinutes,
        waveformColor,
        gradientStartColor,
        gradientEndColor,
        outputFormat
    } = props;
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    
    // Convert minutes to seconds with validation (min: 1 minute, max: 300 minutes = 5 hours)
    const maxMinutes = Math.max(1, Math.min(300, maxRecordingMinutes));
    const MAX_RECORDING_TIME = maxMinutes * 60;
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Format detection and MIME type selection
    const getAudioMimeType = (): string => {
        // Always use WebM format for reliability
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            return "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            return "audio/webm";
        } else {
            // Final fallback
            console.warn("WebM not supported, using default");
            return "";
        }
    };

    // Timer effect
    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    // Security: Auto-stop recording if it exceeds maximum time
                    if (newTime >= MAX_RECORDING_TIME) {
                        debugLog("Maximum recording time reached, stopping automatically");
                        stopRecording();
                        window.mx?.ui?.info(`Recording stopped automatically after ${maxMinutes} minutes`);
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (!uploading) {
                setRecordingTime(0);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [recording, uploading]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Waveform animation
    const updateWaveform = () => {
        if (analyzerRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const bufferLength = analyzerRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyzerRef.current.getByteFrequencyData(dataArray);

            // Create waveform bars (30 bars for smaller container)
            const barCount = 30;
            const barWidth = Math.floor(bufferLength / barCount);
            const newWaveformData: number[] = [];

            for (let i = 0; i < barCount; i++) {
                const start = i * barWidth;
                const end = start + barWidth;
                let sum = 0;
                
                for (let j = start; j < end && j < bufferLength; j++) {
                    sum += dataArray[j];
                }
                
                const average = sum / barWidth;
                // Scale to 4-40px for smaller container
                const height = Math.max(4, (average / 255) * 40); 
                newWaveformData.push(height);
            }

            // Debug logging (only log very occasionally to avoid spam)
            if (Math.random() < 0.01) {
                debugLog("Waveform data sample:", newWaveformData.slice(0, 5), "MediaRecorder state:", mediaRecorderRef.current.state);
            }
            
            setWaveformData(newWaveformData);
            animationRef.current = requestAnimationFrame(updateWaveform);
        } else {
            debugLog("UpdateWaveform not running - analyzer:", !!analyzerRef.current, "mediaRecorder state:", mediaRecorderRef.current?.state);
        }
    };

    const startRecording = async () => {
        try {
            debugLog("Starting recording...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            // Set up audio context for waveform analysis
            audioContextRef.current = new AudioContext();
            debugLog("Audio context state:", audioContextRef.current.state);
            
            // Resume audio context if suspended (required by some browsers)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
                debugLog("Audio context resumed");
            }
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            analyzerRef.current.smoothingTimeConstant = 0.8;
            source.connect(analyzerRef.current);
            
            debugLog("Audio analyzer setup complete, buffer length:", analyzerRef.current.frequencyBinCount);

            // Get the WebM MIME type
            const mimeType = getAudioMimeType();
            debugLog("Selected audio format: WebM, MIME type:", mimeType);

            // Create MediaRecorder with format-specific options
            const options = mimeType ? { mimeType } : {};
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunks.current = [];

            mediaRecorder.ondataavailable = event => {
                debugLog(`Data available - size: ${event.data.size}, type: ${event.data.type}`);
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                    debugLog(`Added chunk, total chunks: ${audioChunks.current.length}`);
                } else {
                    console.warn("Debug: Received empty data chunk");
                }
            };

            mediaRecorder.onstop = async () => {
                // Preserve the recording duration before any cleanup
                const finalRecordingDuration = recordingTime;
                debugLog(`Recording stopped, final duration: ${finalRecordingDuration} seconds`);
                
                // Stop waveform animation
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }
                
                // Clean up audio context
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                
                // Stop media stream
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => {
                        track.stop();
                    });
                    mediaStreamRef.current = null;
                }
                
                // Create blob with WebM MIME type
                const selectedMimeType = getAudioMimeType();
                debugLog(`Creating final blob from ${audioChunks.current.length} chunks`);
                debugLog(`Chunk sizes:`, audioChunks.current.map(chunk => chunk.size));
                
                const audioBlob = new Blob(audioChunks.current, { 
                    type: selectedMimeType || "audio/webm"
                });
                debugLog("Created audio blob with type:", audioBlob.type, "size:", audioBlob.size);
                
                // Additional validation
                if (audioBlob.size === 0) {
                    console.error("Debug: Created blob is empty! This indicates recording failed.");
                    window.mx?.ui?.error("Recording failed - no audio data captured");
                    return;
                }
                
                // Pass the preserved duration to the storage function
                await storeAudioAsBase64(audioBlob, finalRecordingDuration);
            };

            mediaRecorder.start();
            setRecording(true);
            
            // Start waveform animation
            debugLog("Starting waveform animation");
            updateWaveform();
            
        } catch (err) {
            console.error("Microphone access error:", err);
            window.mx?.ui?.error("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            setWaveformData([]); // Clear waveform data
            
            // Stop animation frame
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }
    };

    // Function to fix WebM audio duration metadata using webm-duration-fix
    const fixAudioDuration = async (audioBlob: Blob): Promise<Blob> => {
        try {
            debugLog(`Attempting to fix WebM audio duration`);
            debugLog(`Blob type: ${audioBlob.type}, Blob size: ${audioBlob.size}`);
            // Validate input
            if (!audioBlob || audioBlob.size === 0) {
                console.error("Debug: Invalid or empty audio blob");
                return audioBlob;
            }
            // Use webm-duration-fix to patch the duration in the WebM header
            const fixedBlob = await fixWebmDuration(audioBlob);
            debugLog("WebM duration fixed using webm-duration-fix");
            return fixedBlob;
        } catch (error) {
            console.error("Error in fixAudioDuration:", error);
            return audioBlob; // Return original if fixing fails
        }
    };

    // Function to convert WebM to WAV using Web Audio API
    const convertWebMToWAV = async (webmBlob: Blob): Promise<Blob> => {
        try {
            debugLog("Converting WebM to WAV format");
            
            // Create a temporary audio context for conversion
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Convert blob to array buffer
            const arrayBuffer = await webmBlob.arrayBuffer();
            
            // Decode the WebM audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            debugLog(`Decoded audio: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
            
            // Convert AudioBuffer to WAV
            const wavArrayBuffer = audioBufferToWav(audioBuffer);
            
            // Create WAV blob
            const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
            debugLog(`Converted to WAV: ${wavBlob.size} bytes`);
            
            // Clean up audio context
            await audioContext.close();
            
            return wavBlob;
        } catch (error) {
            console.error("Error converting WebM to WAV:", error);
            debugLog("Conversion failed, returning original WebM blob");
            return webmBlob; // Return original on error
        }
    };

    const storeAudioAsBase64 = async (audioBlob: Blob, actualDurationSeconds?: number) => {
        setUploading(true);

        try {
            debugLog("Converting audio blob to base64");
            debugLog("Selected output format:", outputFormat);

            // Use the provided duration or fall back to recordingTime
            const durationToUse = actualDurationSeconds ?? recordingTime;
            debugLog(`Using duration: ${durationToUse} seconds (provided: ${actualDurationSeconds}, recordingTime: ${recordingTime})`);

            // Fix duration metadata first (always on WebM source)
            const audioWithDuration = await fixAudioDuration(audioBlob);

            // Convert to target format if needed
            let finalAudioBlob: Blob;
            if (outputFormat === "wav") {
                debugLog("Converting WebM to WAV format");
                finalAudioBlob = await convertWebMToWAV(audioWithDuration);
            } else {
                debugLog("Using WebM format (no conversion needed)");
                finalAudioBlob = audioWithDuration;
            }

            // Convert the final audio blob to base64
            const reader = new FileReader();
            const cleanup = () => {
                reader.onloadend = null;
                reader.onerror = null;
            };
            reader.onloadend = () => {
                try {
                    const base64String = reader.result as string;
                    // Remove the data URL prefix (e.g., "data:audio/webm;base64," or "data:audio/wav;base64,")
                    const base64Content = base64String.split(',')[1];

                    debugLog("Base64 conversion complete, length:", base64Content.length);
                    debugLog("Final format:", outputFormat, "Recording duration was:", durationToUse, "seconds");

                    // Store the base64 content in the attribute
                    if (audioContentAttribute && audioContentAttribute.setValue) {
                        audioContentAttribute.setValue(base64Content);
                        debugLog("Base64 content stored in attribute");

                        // Trigger the onChange action
                        debugLog("onChangeAction object:", onChangeAction);
                        if (onChangeAction && onChangeAction.canExecute) {
                            debugLog("Executing onChangeAction");
                            try {
                                onChangeAction.execute();
                                
                                // Clean up response objects if the function exists (newer Mendix versions)
                                // This prevents the "releaseResponseObjects is not a function" error
                                const actionWithCleanup = onChangeAction as any;
                                if (actionWithCleanup.releaseResponseObjects && typeof actionWithCleanup.releaseResponseObjects === 'function') {
                                    debugLog("Calling releaseResponseObjects for cleanup");
                                    actionWithCleanup.releaseResponseObjects();
                                } else {
                                    debugLog("releaseResponseObjects not available (older Mendix version)");
                                }
                            } catch (error) {
                                console.error("Error executing onChangeAction:", error);
                                
                                // Still try to clean up if possible, even if the action failed
                                const actionWithCleanup = onChangeAction as any;
                                if (actionWithCleanup.releaseResponseObjects && typeof actionWithCleanup.releaseResponseObjects === 'function') {
                                    try {
                                        actionWithCleanup.releaseResponseObjects();
                                    } catch (cleanupError) {
                                        console.error("Error during action cleanup:", cleanupError);
                                    }
                                }
                                
                                throw error; // Re-throw the original error
                            }
                        } else {
                            debugLog("No onChangeAction provided or cannot execute");
                        }

                        // Success - no popup message
                        debugLog("Audio recording completed successfully");
                    } else {
                        console.error("Audio content attribute is not available or doesn't have setValue method");
                        debugLog("audioContentAttribute:", audioContentAttribute);
                        window.mx?.ui?.error("Failed to store audio content - no attribute available");
                    }
                } finally {
                    setUploading(false);
                    cleanup();
                }
            };

            reader.onerror = () => {
                try {
                    console.error("Failed to convert audio to base64");
                    window.mx?.ui?.error("Failed to convert audio to base64");
                } finally {
                    setUploading(false);
                    cleanup();
                }
            };

            // Start the conversion with the fixed audio
            reader.readAsDataURL(finalAudioBlob);

        } catch (error) {
            console.error("Store process error:", error);
            window.mx?.ui?.error("Store failed: " + error);
            setUploading(false);
        }
    };

    // Generate waveform colors based on user configuration
    const waveformColors = generateWaveformColors(waveformColor || "#4facfe");

    // Generate background gradient based on user configuration
    const generateBackgroundGradient = (startColor: string, endColor: string): string => {
        const validStartColor = startColor || "#667eea";
        const validEndColor = endColor || "#764ba2";
        return `linear-gradient(135deg, ${validStartColor} 0%, ${validEndColor} 100%)`;
    };

    const backgroundGradient = generateBackgroundGradient(gradientStartColor, gradientEndColor);

    return (
        <div 
            className="audio-recorder-container"
            style={{
                "--waveform-inactive-color": waveformColors.inactive,
                "--waveform-active-color": waveformColors.active,
                "--waveform-glow-color": waveformColors.glow,
                background: backgroundGradient
            } as React.CSSProperties}
        >
            <div className="control-row">
                <div className="timer-display">
                    {formatTime(recordingTime)}
                </div>
                
                <button 
                    className={`record-button ${recording ? 'recording' : ''}`}
                    onClick={recording ? stopRecording : startRecording} 
                    disabled={uploading}
                >
                    <div className={`record-icon ${recording ? 'recording' : ''}`} />
                </button>
            </div>
            
            <div className="waveform-container">
                {recording ? (
                    <div className="waveform">
                        {waveformData.length > 0 ? (
                            waveformData.map((height, index) => (
                                <div
                                    key={index}
                                    className={`waveform-bar ${height > 8 ? 'active' : ''}`}
                                    style={{ height: `${height}px` }}
                                />
                            ))
                        ) : (
                            // Show placeholder bars while waiting for data
                            Array.from({ length: 30 }, (_, index) => (
                                <div
                                    key={index}
                                    className="waveform-bar"
                                    style={{ height: '4px' }}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="waveform-placeholder">
                        {recordingTime > 0 ? completedText : readyText}
                    </div>
                )}
            </div>

            <div className={`status-text ${uploading ? 'processing' : ''}`}>
                {uploading ? processingText : 
                 recording ? recordingText : 
                 recordingTime > 0 ? completedText : 
                 readyText}
            </div>
        </div>
    );
}