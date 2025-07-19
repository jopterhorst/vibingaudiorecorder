# Vibing Audio Recorder Widget

A powerful Mendix pluggable widget that enables users to record audio directly from their microphone and automatically store it as base64 data in any string attribute. Perfect for voice notes, audio feedback, documentation, and user-generated audio content.

## Features

🎤 **Direct Microphone Recording** - Record audio directly in your Mendix app using the browser's MediaRecorder API  
📝 **Base64 Conversion** - Automatically converts recorded audio to base64 format for easy storage  
💾 **Flexible Storage** - Store audio in any string attribute of your context object  
🔧 **Action Integration** - Trigger custom microflows/nanoflows after recording completes  
🎯 **Modern UI** - Beautiful gradient design with real-time waveform visualization  
⏱️ **Built-in Timer** - Shows recording duration in MM:SS format  
🌊 **Live Waveform** - Real-time audio waveform animation that responds to sound levels  
🎵 **WebM Format** - High-quality WebM audio recording with Opus codec for optimal compatibility  
🔒 **Privacy Focused** - Properly releases microphone access after recording  
📱 **Browser Compatible** - Works with modern browsers supporting MediaRecorder API  
🔧 **Duration Fixing** - Automatically fixes WebM duration metadata using webm-duration-fix library  
⏰ **Recording Limit** - Configurable recording time limit (1-300 minutes, default: 2 hours)  
🛡️ **Security Enhanced** - Production-safe logging and error handling  
🎨 **Configurable Text** - Customize all UI text messages for different languages and use cases  
✨ **Vibe Coded** - This entire widget was crafted with pure vibes and good energy 🌟  

## Usage

### Basic Setup

1. **Add the widget** to any page with an object as context (e.g., Customer, Order, Document, etc.)
2. **Configure the properties**:
   - **Audio Content Attribute**: Select a string attribute where the base64 audio will be stored
   - **On Change Action**: Select a microflow/nanoflow to execute after recording
   - **Recording Settings**:
     - **Max Recording Time**: Set maximum recording duration in minutes (1-300, default: 120)
   - **Text Configuration**: Customize the UI text messages:
     - **Ready Text**: Text shown when ready to record (default: "Press record to start")
     - **Recording Text**: Text shown while recording (default: "Recording in progress...")
     - **Processing Text**: Text shown while processing audio (default: "Processing audio...")
     - **Completed Text**: Text shown when recording is completed (default: "Recording completed")
3. **Recording workflow**:
   - User clicks "Record" → microphone access requested and recording starts
   - User clicks "Stop Recording" → recording stops and processing begins
   - Audio is automatically converted to base64 and stored in the selected attribute
   - OnChange action is triggered if configured
   - Microphone access is properly released

### Example Configuration

```
Context Object: Services_Integration.VibeFile
Audio Content Attribute: VibeFile.AudioBase64
On Change Action: ACT_ProcessAudioFile

Recording Settings:
Max Recording Time: 30 (minutes - for shorter voice notes)

Text Configuration (optional - customize for your language/use case):
Ready Text: "Click to start recording"
Recording Text: "Recording your voice..."
Processing Text: "Processing your recording..."
Completed Text: "Recording saved successfully"
```

### Processing Audio Data

After recording, you can access the base64 audio data in your microflows and convert it to a file:

#### Required Module
First, download and import the **CommunityCommons** module from the Mendix Marketplace, which provides the necessary file conversion actions.

#### Step-by-Step File Conversion

```
Input Parameter: $VibeFile (or your entity with the base64 audio data)
Audio Data: $VibeFile/AudioBase64

// Step 1: Convert base64 to FileDocument using CommunityCommons
// Use the "Base64DecodeToFile" action from CommunityCommons module
// - Input: $VibeFile/AudioBase64 (the base64 string)
// - Input: A FileDocument to be filled
// - Output: FileDocument with the audio content

// Step 2: Set the file extension for WebM format
// Set the FileDocument.Name to something like: "recording_" + currentDateTime + ".webm"

// Step 3: Save and use the FileDocument
// Now you have a proper FileDocument that can be:
// - Downloaded by users
// - Stored in your database
// - Used in other microflows
// - Played back using HTML5 audio players
```

#### Example Microflow Steps

1. **Create a FileDocument object**
   - Return: `$NewFileDocument`

2. **Call CommunityCommons.Base64DecodeToFile**
   - Parameter 1: `$VibeFile/AudioBase64`
   - Parameter 2: `$NewFileDocument`
   - Return: `Boolean`

3. **Change Object** (set file properties)
   - Object: `$NewFileDocument`
   - Set `Name` to: `'recording_' + toString([%CurrentDateTime%]) + '.webm'`
   - Set other properties as needed

5. **Commit Object**
   - Object: `$NewFileDocument`

6. **Further Processing** (optional)
   - Download file, send via email, store in cloud, etc.

## Demo Project

Clone this repository and import the widget into your Mendix project to see it in action. The widget works with any entity that has a string attribute for storing the base64 audio content.

## Technical Details

- **Audio Format**: WebM with Opus codec
- **Storage Format**: Base64 string
- **File Extension**: `.webm` (must be set manually when creating FileDocument)
- **File Size**: ~1KB per second (compressed)
- **Maximum Recording Time**: Configurable limit (1-300 minutes, default: 120 minutes)
- **Browser Support**: Chrome, Firefox, Safari, Edge (modern versions with MediaRecorder API)
- **Format Compatibility**: Excellent compression with good browser support
- **Permissions**: Requires user consent for microphone access
- **Dependencies**: 
  - CommunityCommons module required for base64 to file conversion
  - webm-duration-fix library for proper audio duration metadata
- **Security**: Production-safe logging and automatic recording limits

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|--------|
| Chrome | ✅ Full | Best performance |
| Firefox | ✅ Full | Good performance |
| Safari | ✅ Limited | iOS 14.3+ required |
| Edge | ✅ Full | Chromium-based versions |

## Security Features

🛡️ **Configurable Recording Limits** - Set custom maximum recording time (1-300 minutes) to prevent excessive memory usage  
🔒 **Production-Safe Logging** - Debug logs only appear in development environments  
🧹 **Memory Management** - Proper cleanup of audio contexts, media streams, and event listeners  
🎯 **Input Validation** - Validates audio blobs and handles errors gracefully  
🌐 **Customizable UI Text** - All user-facing text can be configured for localization and branding  

## Issues, Suggestions and Feature Requests

Found a bug or have a feature request? Please create an issue on our [GitHub Issues page](https://github.com/jopterhorst/vibingaudiorecorder/issues).

## Development and Contribution

### Prerequisites
- Node.js (v16 or higher)
- Mendix Studio Pro
- Git

### Setup
1. Clone the repository: `git clone https://github.com/jopterhorst/vibingaudiorecorder.git`
2. Install dependencies: `npm install`
3. Start development: `npm start` - automatically builds and deploys to test project

### Building
- **Development**: `npm start` - watches for changes and auto-builds
- **Production**: `npm run build` - creates optimized .mpk file in `/dist` folder

### Dependencies
The widget uses the following key dependencies:
- `webm-duration-fix` - Fixes WebM audio duration metadata
- `classnames` - Utility for conditional CSS classes
- `@mendix/pluggable-widgets-tools` - Mendix widget development tools

### Contributing
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Version History

## Version History

- **v1.0.1** - Added configurable recording time limit
  - ✨ **New**: Custom max recording time (1-300 minutes, default: 120 minutes)
  - 🛡️ **Enhanced**: Recording limits now configurable per widget instance
  - 📝 **Improved**: Better user notifications with actual configured time limit
- **v1.0.0** - Initial release with configurable UI text, enhanced security features, real-time waveform animation, recording timer, and automatic WebM duration fixing
  - ✨ **New**: Configurable text properties for all UI messages
  - 🛡️ **Enhanced**: Security features with 2-hour recording limits
  - 🔧 **Fixed**: Memory leaks and improved error handling
  - 📦 **Updated**: Dependencies including React Native 0.75.4
  - 🎵 **Improved**: WebM duration metadata fixing with webm-duration-fix library

---

Made with ❤️ for the Mendix Community
