import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResultsScreen({ route, navigation }) {
  const { lowQualityPhotos, totalScanned } = route.params;
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [photos, setPhotos] = useState(lowQualityPhotos);

  const updateScanHistory = async (deletedPhotoIds) => {
    try {
      const scanHistoryJson = await AsyncStorage.getItem('scanHistory');
      if (!scanHistoryJson) return;

      const scanHistory = JSON.parse(scanHistoryJson);
      if (scanHistory.length === 0) return;

      // Update the most recent scan
      const updatedHistory = scanHistory.map((scan, index) => {
        if (index === 0) {
          // Update the first (most recent) scan
          return {
            ...scan,
            lowQualityPhotos: scan.lowQualityPhotos.filter(
              photo => !deletedPhotoIds.has(photo.id)
            ),
            lowQualityCount: scan.lowQualityCount - deletedPhotoIds.size,
          };
        }
        return scan;
      });

      await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating scan history:', error);
    }
  };

  const togglePhotoSelection = (photoId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) {
      Alert.alert('No Photos Selected', 'Please select photos to delete.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${selectedPhotos.size} selected photos?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const photosToDelete = Array.from(selectedPhotos);
              await MediaLibrary.deleteAssetsAsync(photosToDelete);
              
              // Update the photos list
              setPhotos(photos.filter(photo => !selectedPhotos.has(photo.id)));
              
              // Update scan history
              await updateScanHistory(selectedPhotos);
              
              setSelectedPhotos(new Set());
              Alert.alert('Success', 'Selected photos have been deleted.');
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Error', 'Failed to delete selected photos.');
            }
          },
        },
      ],
    );
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.photoContainer,
        selectedPhotos.has(item.id) && styles.selectedPhoto,
      ]}
      onPress={() => togglePhotoSelection(item.id)}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoName} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.photoSize}>
          {(item.size / 1024).toFixed(1)} KB
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.subtitle}>
          Found {photos.length} low quality photos out of {totalScanned} total
        </Text>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoGrid}
      />

      {photos.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectionText}>
            {selectedPhotos.size} photos selected
          </Text>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              selectedPhotos.size === 0 && styles.deleteButtonDisabled,
            ]}
            onPress={deleteSelectedPhotos}
            disabled={selectedPhotos.size === 0}
          >
            <Text style={styles.deleteButtonText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  photoGrid: {
    padding: 10,
  },
  photoContainer: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPhoto: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  photoInfo: {
    padding: 8,
  },
  photoName: {
    fontSize: 14,
    color: '#333',
  },
  photoSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#ffcccb',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 