# AI Agent Instructions for Audio Recorder Widget

## Project Overview
This is a **Mendix pluggable widget** that provides advanced audio recording capabilities with WebM/WAV format support, real-time waveform visualization, and Studio Pro integration. The widget records in WebM format natively and converts to WAV when needed using Web Audio API.

## Architecture & Key Components

### Core Files Structure
- **`src/AudioRecorderWidget.tsx`** - Main React component with audio recording logic
- **`src/AudioRecorderWidget.xml`** - Mendix widget property definitions and Studio Pro configuration
- **`src/AudioRecorderWidget.editorConfig.ts`** - Studio Pro editor experience (preview, validation, captions)
- **`src/AudioRecorderWidget.editorPreview.tsx`** - Design-time preview component
- **`typings/AudioRecorderWidgetProps.d.ts`** - Auto-generated TypeScript interfaces from XML

### Audio Processing Pipeline
1. **Always record in WebM** (for browser compatibility and quality)
2. **Fix duration metadata** using `webm-duration-fix` library
3. **Convert to WAV if needed** using `audiobuffer-to-wav` with Web Audio API
4. **Store as base64** in Mendix string attribute

## Critical Development Patterns

### Mendix Global Integration
```typescript
// Always declare Mendix globals
declare global {
    const mx: any;
    interface Window { mx: any; }
}
```

### Production-Safe Debugging
```typescript
const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log(`[AudioRecorder] ${message}`, ...args);
    }
};
```

### Memory Management Pattern
```typescript
// Always clean up audio resources
if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
}
if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
}
```

## Development Workflow

### Essential Commands
- **`npm start`** - Live development with auto-rebuild and test project deployment
- **`npm run build`** - Production build with automatic `.mpk` copy to test project
- **`npm run lint:fix`** - Auto-fix ESLint issues (run before commits)

### Build Configuration
- Widget builds to `dist/1.1.0/*.mpk`
- **Auto-copy to test project**: `postbuild` script copies to `C:\Mendix\Vibing Audio Recorder Demo-main\widgets\`
- Uses `@mendix/pluggable-widgets-tools` for build pipeline

### Property Management
- **XML changes auto-generate TypeScript interfaces** - never edit `AudioRecorderWidgetProps.d.ts`
- **Add new properties**: Update `AudioRecorderWidget.xml`, interfaces regenerate on build
- **Property validation**: Implement in `editorConfig.ts` `check()` function

## Studio Pro Integration Patterns

### Rich Editor Preview
```typescript
export function getPreview(values: AudioRecorderWidgetPreviewProps, isDarkMode: boolean): PreviewProps {
    return {
        type: "Container",
        children: [
            {
                type: "Text",
                content: `Audio Recorder (${formatText})`,
                fontColor: isDarkMode ? "#ffffff" : "#333333"
            }
        ]
    };
}
```

### Property Validation
```typescript
export function check(values: AudioRecorderWidgetPreviewProps): Problem[] {
    const errors: Problem[] = [];
    if (!values.audioContentAttribute) {
        errors.push({
            property: "audioContentAttribute",
            message: "An audio content attribute must be selected",
            severity: "error"
        });
    }
    return errors;
}
```

## Audio Format Handling

### MIME Type Selection
- **Primary**: `audio/webm;codecs=opus`
- **Fallback**: `audio/webm`
- **Never use WAV for recording** - only for output conversion

### Format Conversion Strategy
- Record in WebM for quality and browser compatibility
- Use `webm-duration-fix` to patch metadata issues
- Convert to WAV using Web Audio API when `outputFormat === "wav"`
- Always validate blob size before processing

## CSS Custom Properties Pattern
```css
.audio-recorder-container {
    --waveform-inactive-color: rgba(255, 255, 255, 0.4);
    --waveform-active-color: linear-gradient(to top, #00ff88, #00cc6a);
    --waveform-glow-color: rgba(0, 255, 136, 0.6);
}
```

## TypeScript Declaration Files
- **Create custom declarations** in `typings/` for external libraries
- **Example**: `audiobuffer-to-wav.d.ts` provides type safety for audio conversion

## Security & Resource Management
- **Recording limits**: Enforce 1-300 minute bounds with auto-stop
- **Cleanup pattern**: Always clean up MediaRecorder, MediaStream, AudioContext, and animation frames
- **Production logging**: Debug logs only in development/localhost environments
- **Error handling**: Graceful fallbacks for unsupported browsers/formats

## Common Debugging Points
- **Empty audio blobs**: Check MediaRecorder `ondataavailable` chunks
- **Duration metadata**: WebM files often need `webm-duration-fix` processing
- **Format conversion errors**: Validate AudioContext support and blob contents
- **Mendix action errors**: Handle `releaseResponseObjects` availability gracefully

## Version Management
- Update `package.json` version for releases
- Widget version controls build output directory (`dist/{version}/`)
- Studio Pro caches widgets - increment version for testing changes
