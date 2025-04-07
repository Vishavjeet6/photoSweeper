# PhotoSweeper

PhotoSweeper is a cross-platform mobile application that helps you clean up your photo library by removing duplicate photos and selecting the best quality images from similar photos using AI.

## Features

- Scan your photo library for duplicates
- AI-powered image quality assessment
- Similar photo detection and grouping
- Easy-to-use interface for managing and deleting photos
- Cross-platform support (iOS and Android)
- Scan history to review previous results

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Vishavjeet6/photoSweeper.git
cd photosweeper
```

2. Install dependencies:
```bash
npm install
```

## Getting Started with Expo

1. Install Expo CLI globally (if not already installed):
```bash
npm install -g expo-cli
```

2. Start the development server:
```bash
npx expo start
```

3. Running the app:
   - **On a physical device**: 
     - Install the Expo Go app from the [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS) or [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
     - Scan the QR code displayed in the terminal with your phone's camera (iOS) or the Expo Go app (Android)
   
   - **On simulators/emulators**:
     - Press 'i' to run on iOS simulator (requires Xcode on macOS)
     - Press 'a' to run on Android emulator (requires Android Studio)
     - Press 'w' to open in a web browser (limited functionality)

4. Troubleshooting:
   - If you encounter any issues, try:
     ```bash
     npx expo doctor
     ```
   - For permission issues on Android, you may need to create a development build:
     ```bash
     npx expo prebuild
     ```

## Usage

1. Launch the app and grant photo library access when prompted
2. Tap "Scan Photos" to start the analysis
3. Wait for the scan to complete
4. Review the results and select photos to delete
5. Confirm deletion to free up space
6. Access your scan history through the "Previous Scans" button on the home screen

## Technical Details

The app uses the following technologies:
- React Native with Expo
- AsyncStorage for storing scan history
- Expo MediaLibrary for photo access
- React Navigation for screen management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
