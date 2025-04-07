# PhotoSweeper

PhotoSweeper is a cross-platform mobile application that helps you clean up your photo library by removing duplicate photos and selecting the best quality images from similar photos using AI.

## Features

- Scan your photo library for duplicates
- AI-powered image quality assessment
- Similar photo detection and grouping
- Easy-to-use interface for managing and deleting photos
- Cross-platform support (iOS and Android)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/photosweeper.git
cd photosweeper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- Press 'i' to run on iOS simulator
- Press 'a' to run on Android emulator
- Scan the QR code with your phone's camera to run on your physical device

## Usage

1. Launch the app and grant photo library access when prompted
2. Tap "Scan Photos" to start the analysis
3. Wait for the scan to complete
4. Review the results and select photos to delete
5. Confirm deletion to free up space

## Technical Details

The app uses the following technologies:
- React Native with Expo
- TensorFlow.js for AI-powered image analysis
- Expo MediaLibrary for photo access
- React Navigation for screen management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
