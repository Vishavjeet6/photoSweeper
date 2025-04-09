import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BATCH_SIZE } from '../constants';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  const saveScanResults = async (results) => {
    try {
      // Ensure all arrays exist before accessing their length
      const lowQualityPhotos = results.lowQualityPhotos || [];
      const duplicatePhotos = results.duplicatePhotos || [];
      const similarPhotos = results.similarPhotos || [];
      const cnnPhotos = results.cnnPhotos || [];
      
      const scanData = {
        date: new Date().toISOString(),
        lowQualityCount: lowQualityPhotos.length,
        duplicateCount: duplicatePhotos.length,
        similarCount: similarPhotos.length,
        cnnCount: cnnPhotos.length,
        totalScanned: results.totalScanned || 0,
        lowQualityPhotos: lowQualityPhotos,
        duplicatePhotos: duplicatePhotos,
        similarPhotos: similarPhotos,
        cnnPhotos: cnnPhotos
      };

      // Save only the most recent scan
      await AsyncStorage.setItem('scanHistory', JSON.stringify([scanData]));
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
    setStatusText('Starting scan...');

    try {
      // Get all photos from the media library
      setStatusText('Loading photos...');
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: BATCH_SIZE, // Using the constant for batch size
      });

      if (assets.length === 0) {
        Alert.alert('No Photos', 'No photos found in your library.');
        setIsScanning(false);
        return;
      }

      setStatusText('Analyzing photos...');
      const totalPhotos = assets.length;
      let processedPhotos = 0;
      const lowQualityPhotos = [];
      const duplicatePhotos = [];
      const similarPhotos = [];
      const photoMap = new Map(); // Map to track potential duplicates
      const similarPhotoMap = new Map(); // Map to track potential similar photos

      // Process each photo
      for (const photo of assets) {
        // Update progress
        processedPhotos++;
        setScanProgress((processedPhotos / totalPhotos) * 100);
        setStatusText(`Analyzing photo ${processedPhotos} of ${totalPhotos}...`);

        // Get the photo file
        const photoInfo = await MediaLibrary.getAssetInfoAsync(photo);
        const fileInfo = await FileSystem.getInfoAsync(photoInfo.localUri);
        
        // Check for low quality photos (less than 100KB)
        if (fileInfo.size < 100000) {
          lowQualityPhotos.push({
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            width: photo.width,
            height: photo.height,
            creationTime: photo.creationTime,
            type: 'lowQuality',
          });
        }
        
        // Check for exact duplicates based on file size and creation time
        const duplicateKey = `${fileInfo.size}-${photo.creationTime}`;
        if (photoMap.has(duplicateKey)) {
          // This is an exact duplicate
          const originalPhoto = photoMap.get(duplicateKey);
          
          // Add the original photo to duplicates if not already added
          if (!duplicatePhotos.some(p => p.id === originalPhoto.id)) {
            duplicatePhotos.push({
              ...originalPhoto,
              type: 'duplicate',
              isOriginal: true,
            });
          }
          
          // Add the duplicate photo
          duplicatePhotos.push({
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            width: photo.width,
            height: photo.height,
            creationTime: photo.creationTime,
            type: 'duplicate',
            isOriginal: false,
            originalId: originalPhoto.id,
          });
        } else {
          // Store this photo as a potential original for duplicates
          photoMap.set(duplicateKey, {
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            width: photo.width,
            height: photo.height,
            creationTime: photo.creationTime,
          });
        }
        
        // Check for similar photos based on file size, dimensions, and creation time
        const similarKey = `${Math.floor(fileInfo.size / 10000)}-${Math.floor(photo.width / 100)}-${Math.floor(photo.height / 100)}-${Math.floor(photo.creationTime / 60000)}`; // Group by ranges
        if (similarPhotoMap.has(similarKey)) {
          // This is a potential similar photo
          const originalPhoto = similarPhotoMap.get(similarKey);
          
          // Calculate similarity score
          const timeDiff = Math.abs(photo.creationTime - originalPhoto.creationTime);
          const sizeSimilarity = Math.min(fileInfo.size, originalPhoto.size) / Math.max(fileInfo.size, originalPhoto.size);
          const dimensionSimilarity = Math.min(photo.width * photo.height, originalPhoto.width * originalPhoto.height) /
                                    Math.max(photo.width * photo.height, originalPhoto.width * originalPhoto.height);
          
          // If photos are very similar (taken within 1 minute and similar size/dimensions)
          if (timeDiff <= 60000 && sizeSimilarity > 0.7 && dimensionSimilarity > 0.7) {
            // Add the original photo to similar photos if not already added
            if (!similarPhotos.some(p => p.id === originalPhoto.id)) {
              similarPhotos.push({
                ...originalPhoto,
                type: 'similar',
                isOriginal: true,
              });
            }
            
            // Add the similar photo
            similarPhotos.push({
              id: photo.id,
              filename: photo.filename,
              uri: photoInfo.localUri,
              size: fileInfo.size,
              width: photo.width,
              height: photo.height,
              creationTime: photo.creationTime,
              type: 'similar',
              isOriginal: false,
              originalId: originalPhoto.id,
            });
          }
        } else {
          // Store this photo as a potential original for similar photos
          similarPhotoMap.set(similarKey, {
            id: photo.id,
            filename: photo.filename,
            uri: photoInfo.localUri,
            size: fileInfo.size,
            width: photo.width,
            height: photo.height,
            creationTime: photo.creationTime,
          });
        }
      }

      setStatusText('Saving results...');
      const results = {
        lowQualityPhotos,
        duplicatePhotos,
        similarPhotos,
        totalScanned: totalPhotos,
      };

      // Save scan results
      await saveScanResults(results);

      // Navigate to results screen with the photos
      navigation.navigate('Results', {
        lowQualityPhotos: lowQualityPhotos || [],
        duplicatePhotos: duplicatePhotos || [],
        similarPhotos: similarPhotos || [],
        totalScanned: totalPhotos || 0
      });

    } catch (error) {
      console.error('Error scanning photos:', error);
      Alert.alert('Error', 'An error occurred while scanning photos.');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setStatusText('');
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
          Scan your photos to find and remove low quality and duplicate images
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
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.progressText}>
              {statusText} {Math.round(scanProgress)}%
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