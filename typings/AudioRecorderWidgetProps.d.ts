/**
 * This file was generated from AudioRecorderWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue } from "mendix";

export interface AudioRecorderWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    audioContentAttribute: EditableValue<string>;
    onChangeAction?: ActionValue;
    maxRecordingMinutes?: number;
    readyText: string;
    recordingText: string;
    processingText: string;
    completedText: string;
}

export interface AudioRecorderWidgetPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    audioContentAttribute: string;
    onChangeAction: {} | null;
    maxRecordingMinutes: number | null;
    readyText: string;
    recordingText: string;
    processingText: string;
    completedText: string;
}
