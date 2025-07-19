import { Component, ReactNode, createElement } from "react";
import { AudioRecorderWidgetPreviewProps } from "../typings/AudioRecorderWidgetProps";

export class preview extends Component<AudioRecorderWidgetPreviewProps> {
    render(): ReactNode {
        return (
            <div className={this.props.className} style={this.props.styleObject}>
                <div className="audio-recorder-container">
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