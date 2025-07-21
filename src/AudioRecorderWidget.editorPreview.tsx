import { Component, ReactNode, createElement } from "react";
import { AudioRecorderWidgetPreviewProps } from "../typings/AudioRecorderWidgetProps";

export class preview extends Component<AudioRecorderWidgetPreviewProps> {
    render(): ReactNode {
        const gradientStart = this.props.gradientStartColor || "#667eea";
        const gradientEnd = this.props.gradientEndColor || "#764ba2";
        const backgroundGradient = `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
        
        return (
            <div className={this.props.className} style={this.props.styleObject}>
                <div 
                    className="audio-recorder-container"
                    style={{ background: backgroundGradient }}
                >
                    <div className="control-row">
                        <div className="timer-display">
                            00:00
                        </div>
                        
                        <button 
                            className="record-button"
                            disabled
                        >
                            <div className="record-icon" />
                        </button>
                    </div>
                    
                    <div className="waveform-container">
                        <div className="waveform-placeholder">
                            {this.props.readyText}
                        </div>
                    </div>

                    <div className="status-text">
                        {this.props.readyText}
                    </div>
                </div>
            </div>
        );
    }
}

export function getPreviewCss(): string {
    return require("./ui/AudioRecorderWidget.css");
}