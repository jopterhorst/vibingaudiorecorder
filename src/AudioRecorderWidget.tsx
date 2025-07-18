// Minimal type declarations for Mendix globals
declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mx: any;
    interface Window {
        mx: any;
    }
}

import { ReactElement, createElement, useRef, useState } from "react";
import "./ui/AudioRecorderWidget.css";

export function AudioRecorderWidget({ audioContentAttribute, onChangeAction }: { audioContentAttribute: any; onChangeAction?: any }): ReactElement {
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream; // Store stream reference
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunks.current = [];

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Ensure media stream is stopped when recording ends
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => {
                        track.stop();
                    });
                    mediaStreamRef.current = null;
                }
                
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                // Don't create URL for playback - we don't want to show the player
                // const url = URL.createObjectURL(audioBlob);
                // setAudioUrl(url);

                // Convert to base64 and store in attribute
                await storeAudioAsBase64(audioBlob);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error("Microphone access error:", err);
            window.mx?.ui?.error("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            
            // Stop all tracks in the media stream to release microphone access
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                });
                mediaStreamRef.current = null;
                console.log("Debug: Media stream stopped and microphone released");
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
        <div className="audio-recorder-widget">
            <button onClick={recording ? stopRecording : startRecording} disabled={uploading}>
                {recording ? "Stop Recording" : "Record"}
            </button>

            {uploading && (
                <div style={{ marginTop: 10 }}>
                    <span>Processing audio...</span>
                </div>
            )}
        </div>
    );
}