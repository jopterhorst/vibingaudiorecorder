import { Component, ReactNode, createElement } from "react";
import { AudioRecorderWidgetPreviewProps } from "../typings/AudioRecorderWidgetProps";

export class preview extends Component<AudioRecorderWidgetPreviewProps> {
    render(): ReactNode {
        return (
            <div className={this.props.className} style={this.props.styleObject}>
                <button disabled>Record Audio</button>
                <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                    Audio Recorder Widget Preview
                </div>
            </div>
        );
    }
}

export function getPreviewCss(): string {
    return require("./ui/AudioRecorderWidget.css");
}