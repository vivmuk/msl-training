# MSL-HCP Training Platform

A modern, interactive training platform for Medical Science Liaisons (MSL) to practice conversations with Healthcare Professionals (HCP) using HeyGen's Interactive AI Avatars.

## 🚀 Enhanced Features

### 🎥 Real-time Video & Audio
- **Live User Camera**: Real webcam integration with permission handling and error recovery
- **Interactive HeyGen Avatars**: AI-powered HCP avatars using HeyGen's Streaming Avatar SDK v2.0.16
- **Side-by-Side Video**: See yourself and the HCP avatar simultaneously for immersive training
- **Two-Way Audio Dialogue**: Full voice chat capabilities with speech-to-text and text-to-speech
- **Visual Speaking Indicators**: Real-time visual feedback showing when avatar or user is speaking
- **Audio Recording Support**: Capture and process both avatar and user audio streams

### 🎛️ Advanced Controls
- **Voice Chat Controls**: Start/stop voice conversations with intuitive UI controls
- **Microphone Management**: Mute/unmute functionality with visual feedback
- **Avatar Interruption**: Ability to interrupt avatar mid-conversation
- **Real-time Connection Status**: Live indicators for session and connection health
- **Audio Visualization**: Dynamic visual feedback during speech

### 💬 Communication Features
- **Multi-modal Interaction**: Switch seamlessly between voice and text communication
- **Real-time Chat Interface**: Text-based conversation fallback with immediate responses
- **Session Metrics**: Track training duration, message count, and engagement
- **Demo Mode**: Full functionality without requiring HeyGen API credentials

### 🎨 User Experience
- **Modern UI/UX**: Clean, professional interface built with React and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Built with WCAG 2.1 compliance and screen reader support
- **Professional Medical Design**: Custom healthcare-themed color scheme and animations
- **Error Recovery**: Graceful error handling with user-friendly retry mechanisms

## 🛠 Technology Stack

### Core Framework
- **Frontend**: React 18 with TypeScript for type safety and modern development
- **State Management**: React hooks for component state and session management
- **Build Tool**: Create React App with custom TypeScript configurations

### Real-time Communication
- **HeyGen SDK**: `@heygen/streaming-avatar` v2.0.16 for Interactive Avatar integration
- **WebRTC**: Native browser WebRTC for user camera and microphone access
- **LiveKit**: Real-time video streaming infrastructure
- **Speech Processing**: Deepgram STT (Speech-to-Text) integration

### UI/UX & Design
- **Styling**: Tailwind CSS with custom medical-themed design system
- **Animations**: Framer Motion for smooth, professional animations and transitions
- **Components**: Modular React components (UserCamera, AvatarVideo, VoiceControls)
- **Responsive Design**: Mobile-first approach with desktop optimization

### Media & Camera
- **Camera Integration**: `react-webcam` for user video capture
- **Media Streams**: WebRTC MediaStream API for audio/video processing
- **Audio Visualization**: Real-time audio level visualization
- **Stream Management**: Efficient resource cleanup and error handling

## 📋 Prerequisites

### Development Requirements
- Node.js (v16 or higher)
- npm or yarn package manager
- HeyGen API key (optional for demo mode)

### Browser Requirements
- Modern browser with WebRTC support (Chrome 60+, Firefox 60+, Safari 14+, Edge 80+)
- Camera and microphone permissions for full functionality
- Stable internet connection for real-time video/audio streaming

### Hardware Recommendations
- Built-in or external webcam (720p or higher recommended)
- Microphone or headset for clear audio
- Minimum 4GB RAM for smooth video processing
- Broadband internet connection (5 Mbps+ recommended)

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   # Edit .env and add your HeyGen API key
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_HEYGEN_API_KEY=your_heygen_api_key_here
REACT_APP_HEYGEN_SERVER_URL=https://api.heygen.com
```

### HeyGen API Setup

1. Sign up for a HeyGen account at [https://heygen.com](https://heygen.com)
2. Navigate to your API settings
3. Generate an API key
4. Add the key to your `.env` file

## 🎯 Usage

### Demo Mode (No API Key Required)

The application includes a comprehensive demo mode that allows you to explore all features without a HeyGen API key:

1. Start the application
2. Leave the API key field empty
3. Click "Start Training Session"
4. Enable your camera when prompted
5. Experience the full interface with simulated HCP interactions
6. Test voice chat controls and visual indicators

### Production Mode (With API Key)

Experience full real-time AI avatar interactions:

1. Enter your HeyGen API key in the welcome screen
2. Click "Start Training Session"
3. Grant camera and microphone permissions when prompted
4. Wait for the avatar to initialize and connect
5. Use voice chat controls to start real-time conversation
6. Switch between voice and text communication modes

### Voice Chat Features

Once connected, you can:

- **Start Voice Chat**: Click the microphone button to begin real-time voice conversation
- **Mute/Unmute**: Control your microphone during conversations
- **Interrupt Avatar**: Stop the avatar mid-sentence if needed
- **Visual Feedback**: See real-time indicators when you or the avatar is speaking
- **Audio Visualization**: Watch dynamic audio level indicators during speech

## 🏥 HCP Avatar Scenarios

The platform includes several HCP specialties:

- **Cardiology**: Practice with Dr. Alex, an experienced cardiologist
- **Oncology**: Interact with Dr. Michael Rodriguez, a cancer specialist
- **Neurology**: Train with Dr. Emily Johnson, a neurologist
- **General Medicine**: Meet Dr. David Wilson, a general practitioner

## 🎨 Design System

The application uses a custom medical-themed design system:

- **Primary Colors**: Professional blues (#0ea5e9, #0284c7)
- **Medical Grays**: Clean, accessible grays (#64748b, #475569)
- **Typography**: Inter font family for excellent readability
- **Components**: Reusable UI components with consistent styling

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop computers (1024px and up)
- Tablets (768px - 1023px)
- Mobile phones (320px - 767px)

## ♿ Accessibility

Built with accessibility in mind:

- WCAG 2.1 compliant color contrast
- Screen reader support
- Keyboard navigation
- Reduced motion support
- High contrast mode support

## 🔒 Security

- API keys are stored securely in environment variables
- No sensitive data is logged or stored in localStorage
- All API communications use HTTPS

## 📊 Session Metrics

Track your training progress:

- **Duration**: Total session time
- **Messages**: Number of exchanges with the HCP
- **Engagement**: Real-time interaction metrics
- **Completion Rate**: Training scenario completion status

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Common Platforms

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Upload the build folder to Netlify
```

#### AWS S3 + CloudFront
```bash
npm run build
# Upload to S3 and configure CloudFront
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Check the [Issues](https://github.com/your-username/msl-hcp-training/issues) page
- Review the [HeyGen Documentation](https://docs.heygen.com)
- Contact the development team

## 🙏 Acknowledgments

- [HeyGen](https://heygen.com) for Interactive Avatar technology
- [LiveKit](https://livekit.io) for real-time video infrastructure
- [Tailwind CSS](https://tailwindcss.com) for the styling framework
- [Framer Motion](https://framer.com/motion) for animations

## 📈 Roadmap

### ✅ Completed Features
- [x] Real-time user camera integration
- [x] Two-way audio dialogue with voice chat
- [x] Visual speaking indicators and audio visualization
- [x] Voice chat controls (mute, interrupt, start/stop)
- [x] HeyGen Streaming Avatar SDK integration
- [x] Enhanced error handling and user feedback

### 🚧 In Progress
- [ ] Audio recording and session playback
- [ ] Advanced session analytics and progress tracking
- [ ] Multiple HCP avatar selection interface

### 🔮 Future Enhancements
- [ ] Multi-language support for global training
- [ ] Advanced analytics dashboard with detailed metrics
- [ ] Custom avatar creation and training scenarios
- [ ] AI-powered conversation analysis and feedback
- [ ] Mobile app version with native camera integration
- [ ] Real-time transcription and conversation summaries
- [ ] Integration with Learning Management Systems (LMS)
- [ ] Advanced voice coaching and pronunciation feedback

---

**Built with ❤️ for Medical Science Liaisons** 