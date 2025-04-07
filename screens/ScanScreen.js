import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  const saveScanResults = async (results) => {
    try {
      const timestamp = new Date().toISOString();
      const scanData = {
        timestamp,
        totalScanned: results.totalScanned,
        lowQualityCount: results.lowQualityPhotos.length,
        lowQualityPhotos: results.lowQualityPhotos,
      };

      // Get existing scans
      const existingScansJson = await AsyncStorage.getItem('scanHistory');
      const existingScans = existingScansJson ? JSON.parse(existingScansJson) : [];

      // Add new scan to history
      const updatedScans = [scanData, ...existingScans];

      // Save updated history
      await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedScans));
    } catch (error) {
      console.error('Error saving scan results:', error);
    }
  };

  const scanPhotos = async () => {
    if (!hasPermission) {
      Alert.alert('Permission required', 'Please grant media library permissions to use this feature.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      // Get all photos from the media library
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1000, // Limit to first 1000 photos for testing
      });

      const totalPhotos = assets.length;
      let processedPhotos = 0;
      const lowQualityPhotos = [];

      // Process each photo
      for (const photo of assets) {
        // Update progress
        processedPhotos++;
        setScanProgress((processedPhotos / totalPhotos) * 100);

        // Get the photo file
        const photoInfo = await MediaLibrary.getAssetInfoAsync(photo);
        
        // TODO: Implement photo quality assessment
        // For now, we'll just check file size as a basic metric
        const fileInfo = await FileSystem.getInfoAsync(photoInfo.localUri);
        
        if (fileInfo.size < 100000) { // Less than 100KB
          // Add to low quality photos list
          lowQualityPhotos.push({
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            creationTime: photo.creationTime,
          });
        }
      }

      const results = {
        lowQualityPhotos,
        totalScanned: totalPhotos,
      };

      // Save scan results
      await saveScanResults(results);

      // Navigate to results screen with the low quality photos
      navigation.navigate('Results', results);

    } catch (error) {
      console.error('Error scanning photos:', error);
      Alert.alert('Error', 'An error occurred while scanning photos.');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to media library</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PhotoSweeper</Text>
        <Text style={styles.description}>
          Scan your photos to find and remove low quality images
        </Text>
        
        <TouchableOpacity
          style={styles.scanButton}
          onPress={scanPhotos}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </Text>
        </TouchableOpacity>
        
        {isScanning && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size={48} color="#2196F3" />
            <Text style={styles.progressText}>
              Scanning photos... {Math.round(scanProgress)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
}); 