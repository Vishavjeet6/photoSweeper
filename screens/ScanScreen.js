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
        duplicateCount: results.duplicatePhotos.length,
        similarCount: results.similarPhotos.length,
        lowQualityPhotos: results.lowQualityPhotos,
        duplicatePhotos: results.duplicatePhotos,
        similarPhotos: results.similarPhotos,
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
      const duplicatePhotos = [];
      const similarPhotos = [];

      // Create a map to track photos by size and creation time
      const photoMap = new Map();

      // Process each photo
      for (const photo of assets) {
        // Update progress
        processedPhotos++;
        setScanProgress((processedPhotos / totalPhotos) * 100);

        // Get the photo file
        const photoInfo = await MediaLibrary.getAssetInfoAsync(photo);
        const fileInfo = await FileSystem.getInfoAsync(photoInfo.localUri);
        
        // Check for low quality
        if (fileInfo.size < 100000) { // Less than 100KB
          lowQualityPhotos.push({
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            creationTime: photo.creationTime,
          });
        }

        // Check for duplicates and similar photos
        const key = `${fileInfo.size}_${photo.creationTime}`;
        if (photoMap.has(key)) {
          // Exact duplicate found
          duplicatePhotos.push({
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            creationTime: photo.creationTime,
            originalPhoto: photoMap.get(key)
          });
        } else {
          // Check for similar photos (within 5% size difference)
          const similarKey = Array.from(photoMap.keys()).find(existingKey => {
            const [existingSize] = existingKey.split('_');
            const sizeDiff = Math.abs(fileInfo.size - parseInt(existingSize)) / fileInfo.size;
            return sizeDiff <= 0.05; // 5% threshold
          });

          if (similarKey) {
            similarPhotos.push({
              id: photo.id,
              filename: photo.filename,
              uri: photoInfo.localUri,
              size: fileInfo.size,
              creationTime: photo.creationTime,
              originalPhoto: photoMap.get(similarKey),
              similarity: 1 - Math.abs(fileInfo.size - parseInt(similarKey.split('_')[0])) / fileInfo.size
            });
          } else {
            // Store this photo as a potential original
            photoMap.set(key, {
              id: photo.id,
              filename: photo.filename,
              uri: photoInfo.localUri,
              size: fileInfo.size,
              creationTime: photo.creationTime
            });
          }
        }
      }

      // Group similar photos
      const similarGroups = [];
      const processedIds = new Set();

      similarPhotos.forEach(photo => {
        if (!processedIds.has(photo.id)) {
          const group = {
            id: photo.id,
            original: photo.originalPhoto,
            duplicates: similarPhotos.filter(p => 
              p.originalPhoto.id === photo.originalPhoto.id && p.id !== photo.id
            )
          };
          similarGroups.push(group);
          processedIds.add(photo.id);
          group.duplicates.forEach(p => processedIds.add(p.id));
        }
      });

      const results = {
        lowQualityPhotos,
        duplicatePhotos,
        similarPhotos: similarGroups,
        totalScanned: totalPhotos,
      };

      // Save scan results
      await saveScanResults(results);

      // Navigate to results screen
      navigation.navigate('Results', { results });

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
          Scan your photos to find low quality, duplicate, and similar images
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