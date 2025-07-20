import { AudioRecorderWidgetPreviewProps } from "../typings/AudioRecorderWidgetProps";

export type Platform = "web" | "desktop";

export type Properties = PropertyGroup[];

type PropertyGroup = {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
};

type Property = {
    key: string;
    caption: string;
    description?: string;
    objectHeaders?: string[]; // used for customizing object grids
    objects?: ObjectProperties[];
    properties?: Properties[];
};

type ObjectProperties = {
    properties: PropertyGroup[];
    captions?: string[]; // used for customizing object grids
};

export type Problem = {
    property?: string; // key of the property, at which the problem exists
    severity?: "error" | "warning" | "deprecation"; // default = "error"
    message: string; // description of the problem
    studioMessage?: string; // studio-specific message, defaults to message
    url?: string; // link with more information about the problem
    studioUrl?: string; // studio-specific link
};

type BaseProps = {
    type: "Image" | "Container" | "RowLayout" | "Text" | "DropZone" | "Selectable" | "Datasource";
    grow?: number; // optionally sets a growth factor if used in a layout (default = 1)
};

type ImageProps = BaseProps & {
    type: "Image";
    document?: string; // svg image
    data?: string; // base64 image
    property?: object; // widget image property object from Values API
    width?: number; // sets a fixed maximum width
    height?: number; // sets a fixed maximum height
};

type ContainerProps = BaseProps & {
    type: "Container" | "RowLayout";
    children: PreviewProps[]; // any other preview element
    borders?: boolean; // sets borders around the layout to visually group its children
    borderRadius?: number; // integer. Can be used to create rounded borders
    backgroundColor?: string; // HTML color, formatted #RRGGBB
    borderWidth?: number; // sets the border width
    padding?: number; // integer. adds padding around the container
};

type RowLayoutProps = ContainerProps & {
    type: "RowLayout";
    columnSize?: "fixed" | "grow"; // default is fixed
};

type TextProps = BaseProps & {
    type: "Text";
    content: string; // text that should be shown
    fontSize?: number; // sets the font size
    fontColor?: string; // HTML color, formatted #RRGGBB
    bold?: boolean;
    italic?: boolean;
};

type DropZoneProps = BaseProps & {
    type: "DropZone";
    property: object; // widgets property object from Values API
    placeholder: string; // text to be shown inside the dropzone when empty
    showDataSourceHeader?: boolean; // true by default. Toggles whether to show a header containing information about the datasource
};

type SelectableProps = BaseProps & {
    type: "Selectable";
    object: object; // object property instance from the Value API
    child: PreviewProps; // any type of preview property to visualize the object instance
};

type DatasourceProps = BaseProps & {
    type: "Datasource";
    property: object | null; // datasource property object from Values API
    child?: PreviewProps; // any type of preview property component (optional)
};

export type PreviewProps =
    | ImageProps
    | ContainerProps
    | RowLayoutProps
    | TextProps
    | DropZoneProps
    | SelectableProps
    | DatasourceProps;

export function getProperties(
    values: AudioRecorderWidgetPreviewProps,
    defaultProperties: Properties /* , target: Platform*/
): Properties {
    // Hide certain properties based on output format selection
    if (values.outputFormat === "webm") {
        // When WebM is selected, no additional properties needed
    } else if (values.outputFormat === "wav") {
        // When WAV is selected, no additional properties needed (conversion is automatic)
    }
    
    // Could add conditional logic here in the future, for example:
    // - Hide certain text properties if a "simple mode" is enabled
    // - Show advanced timing properties only when needed
    
    return defaultProperties;
}

export function check(values: AudioRecorderWidgetPreviewProps): Problem[] {
    const errors: Problem[] = [];
    
    // Validate that an audio content attribute is selected
    if (!values.audioContentAttribute) {
        errors.push({
            property: "audioContentAttribute",
            message: "An audio content attribute must be selected to store the recorded audio.",
            severity: "error"
        });
    }
    
    // Validate max recording minutes
    if (values.maxRecordingMinutes !== null && (values.maxRecordingMinutes < 1 || values.maxRecordingMinutes > 300)) {
        errors.push({
            property: "maxRecordingMinutes",
            message: "Maximum recording time must be between 1 and 300 minutes.",
            severity: "error"
        });
    }
    
    // Validate waveform color format
    if (values.waveformColor && !/^#[0-9A-Fa-f]{6}$/.test(values.waveformColor)) {
        errors.push({
            property: "waveformColor",
            message: "Waveform color must be a valid hex color (e.g., #4facfe).",
            severity: "warning"
        });
    }
    
    return errors;
}

export function getPreview(values: AudioRecorderWidgetPreviewProps, isDarkMode: boolean, _version: number[]): PreviewProps {
    const formatText = values.outputFormat === "wav" ? "WAV" : "WebM";
    const attributeText = values.audioContentAttribute ? ` → ${values.audioContentAttribute}` : " (No attribute)";
    
    return {
        type: "Container",
        borders: true,
        borderRadius: 8,
        backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
        padding: 16,
        children: [
            {
                type: "Container",
                children: [
                    {
                        type: "Text",
                        content: `Audio Recorder (${formatText})`,
                        fontSize: 14,
                        bold: true,
                        fontColor: isDarkMode ? "#ffffff" : "#333333"
                    },
                    {
                        type: "Text",
                        content: attributeText,
                        fontSize: 12,
                        fontColor: isDarkMode ? "#cccccc" : "#666666"
                    }
                ]
            },
            {
                type: "Container",
                borderRadius: 6,
                backgroundColor: isDarkMode ? "#404040" : "#e9ecef",
                padding: 12,
                children: [
                    {
                        type: "Text",
                        content: values.readyText || "Press record to start",
                        fontSize: 12,
                        fontColor: isDarkMode ? "#cccccc" : "#6c757d"
                    },
                    {
                        type: "Container",
                        backgroundColor: values.waveformColor || "#4facfe",
                        borderRadius: 3,
                        children: [
                            {
                                type: "Text",
                                content: "▄▃▅▂▆▃▄▅▂▃▆▄▃▅",
                                fontSize: 10,
                                fontColor: "#ffffff"
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

export function getCustomCaption(values: AudioRecorderWidgetPreviewProps, _platform: Platform): string {
    const format = values.outputFormat === "wav" ? "WAV" : "WebM";
    const attribute = values.audioContentAttribute || "No attribute";
    return `Audio Recorder (${format}) → ${attribute}`;
}
