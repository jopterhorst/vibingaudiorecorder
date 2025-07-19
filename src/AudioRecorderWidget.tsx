// Minimal type declarations for Mendix globals
declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mx: any;
    interface Window {
        mx: any;
    }
}

import { ReactElement, createElement, useRef, useState, useEffect } from "react";
import "./ui/AudioRecorderWidget.css";

export function AudioRecorderWidget({ audioContentAttribute, onChangeAction }: { audioContentAttribute: any; onChangeAction?: any }): ReactElement {
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Timer effect
    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
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

            // Debug logging (only log occasionally to avoid spam)
            if (Math.random() < 0.1) {
                console.log("Waveform data sample:", newWaveformData.slice(0, 5), "MediaRecorder state:", mediaRecorderRef.current.state);
            }
            
            setWaveformData(newWaveformData);
            animationRef.current = requestAnimationFrame(updateWaveform);
        } else {
            console.log("UpdateWaveform not running - analyzer:", !!analyzerRef.current, "mediaRecorder state:", mediaRecorderRef.current?.state);
        }
    };

    const startRecording = async () => {
        try {
            console.log("Starting recording...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            // Set up audio context for waveform analysis
            audioContextRef.current = new AudioContext();
            console.log("Audio context state:", audioContextRef.current.state);
            
            // Resume audio context if suspended (required by some browsers)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
                console.log("Audio context resumed");
            }
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            analyzerRef.current.smoothingTimeConstant = 0.8;
            source.connect(analyzerRef.current);
            
            console.log("Audio analyzer setup complete, buffer length:", analyzerRef.current.frequencyBinCount);

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunks.current = [];

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
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
                
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                await storeAudioAsBase64(audioBlob);
            };

            mediaRecorder.start();
            setRecording(true);
            
            // Start waveform animation
            console.log("Starting waveform animation");
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

    const storeAudioAsBase64 = async (audioBlob: Blob) => {
        setUploading(true);

        try {
            console.log("Debug: Converting audio blob to base64");
            
            // Convert the audio blob to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
                const base64Content = base64String.split(',')[1];
                
                console.log("Debug: Base64 conversion complete, length:", base64Content.length);
                
                // Store the base64 content in the attribute
                if (audioContentAttribute && audioContentAttribute.setValue) {
                    audioContentAttribute.setValue(base64Content);
                    console.log("Debug: Base64 content stored in attribute");
                    
                    // Trigger the onChange action
                    console.log("Debug: onChangeAction object:", onChangeAction);
                    if (onChangeAction) {
                        if (typeof onChangeAction === 'function') {
                            console.log("Debug: onChangeAction is a function, calling directly");
                            onChangeAction();
                        } else if (onChangeAction.execute && typeof onChangeAction.execute === 'function') {
                            console.log("Debug: Calling onChangeAction.execute()");
                            onChangeAction.execute();
                        } else if (onChangeAction.get && typeof onChangeAction.get === 'function') {
                            console.log("Debug: Calling onChangeAction.get().execute()");
                            const action = onChangeAction.get();
                            if (action && action.execute) {
                                action.execute();
                            }
                        } else {
                            console.log("Debug: onChangeAction structure:", Object.keys(onChangeAction || {}));
                            console.log("Debug: Trying to call onChangeAction directly as function");
                            try {
                                onChangeAction();
                            } catch (e) {
                                console.error("Debug: Failed to call onChangeAction:", e);
                            }
                        }
                    } else {
                        console.log("Debug: No onChangeAction provided");
                    }
                    
                    // Success - no popup message
                    console.log("Debug: Audio recording completed successfully");
                } else {
                    console.error("Audio content attribute is not available or doesn't have setValue method");
                    console.log("Debug: audioContentAttribute:", audioContentAttribute);
                    window.mx.ui.error("Failed to store audio content - no attribute available");
                }
                
                setUploading(false);
            };
            
            reader.onerror = () => {
                console.error("Failed to convert audio to base64");
                window.mx.ui.error("Failed to convert audio to base64");
                setUploading(false);
            };
            
            // Start the conversion
            reader.readAsDataURL(audioBlob);
            
        } catch (error) {
            console.error("Store process error:", error);
            window.mx.ui.error("Store failed: " + error);
            setUploading(false);
        }
    };

    return (
        <div className="audio-recorder-container">
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
                        {recordingTime > 0 ? "Recording completed" : "Press record to start"}
                    </div>
                )}
            </div>

            <div className={`status-text ${uploading ? 'processing' : ''}`}>
                {uploading ? "Processing audio..." : 
                 recording ? "Recording in progress..." : 
                 recordingTime > 0 ? "Recording completed" : 
                 "Ready to record"}
            </div>
        </div>
    );
}