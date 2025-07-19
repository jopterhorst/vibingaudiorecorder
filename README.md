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
⚡ **No Dependencies** - Pure implementation without external audio libraries  
✨ **Vibe Coded** - This entire widget was crafted with pure vibes and good energy 🌟  

## Usage

### Basic Setup

1. **Add the widget** to any page with an object as context (e.g., Customer, Order, Document, etc.)
2. **Configure the properties**:
   - **Audio Content Attribute**: Select a string attribute where the base64 audio will be stored
   - **On Change Action**: Select a microflow/nanoflow to execute after recording
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
- **Browser Support**: Chrome, Firefox, Safari, Edge (modern versions with MediaRecorder API)
- **Format Compatibility**: Excellent compression with good browser support
- **Permissions**: Requires user consent for microphone access
- **Dependencies**: CommunityCommons module required for base64 to file conversion

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|--------|
| Chrome | ✅ Full | Best performance |
| Firefox | ✅ Full | Good performance |
| Safari | ✅ Limited | iOS 14.3+ required |
| Edge | ✅ Full | Chromium-based versions |

## Issues, Suggestions and Feature Requests

Found a bug or have a feature request? Please create an issue on our [GitHub Issues page](https://github.com/jopterhorst/vibingaudiorecorder/issues).

## Development and Contribution

### Prerequisites
- Node.js (v14 or higher)
- Mendix Studio Pro
- Git

### Setup
1. Clone the repository: `git clone https://github.com/jopterhorst/vibingaudiorecorder.git`
2. Install dependencies: `npm install` (use `npm install --legacy-peer-deps` for NPM v7+)
3. Start development: `npm start` - automatically builds and deploys to test project

### Building
- **Development**: `npm start` - watches for changes and auto-builds
- **Production**: `npm run build` - creates optimized .mpk file in `/dist` folder

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

- **v1.0.0** - Initial release with modern UI, real-time waveform animation, recording timer, and dual-format support (WebM/WAV)

---

Made with ❤️ for the Mendix Community
