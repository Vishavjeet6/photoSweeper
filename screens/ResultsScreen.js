import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DuplicatePhotoList from '../components/DuplicatePhotoList';
import LowQualityPhotoList from '../components/LowQualityPhotoList';
import SimilarPhotosList from '../components/SimilarPhotosList';

export default function ResultsScreen({ route, navigation }) {
  // Ensure we have valid arrays even if route.params is missing properties
  const { lowQualityPhotos = [], duplicatePhotos = [], similarPhotos = [], totalScanned = 0 } = route.params || {};
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [activeTab, setActiveTab] = useState('lowQuality');

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
          if (activeTab === 'lowQuality') {
            return {
              ...scan,
              lowQualityPhotos: scan.lowQualityPhotos.filter(
                photo => !deletedPhotoIds.has(photo.id)
              ),
              lowQualityCount: scan.lowQualityCount - deletedPhotoIds.size,
            };
          } else if (activeTab === 'duplicate') {
            return {
              ...scan,
              duplicatePhotos: scan.duplicatePhotos.filter(
                photo => !deletedPhotoIds.has(photo.id)
              ),
              duplicateCount: scan.duplicateCount - deletedPhotoIds.size,
            };
          } else if (activeTab === 'similar') {
            return {
              ...scan,
              similarPhotos: scan.similarPhotos.filter(
                photo => !deletedPhotoIds.has(photo.id)
              ),
              similarCount: scan.similarCount - deletedPhotoIds.size,
            };
          }
        }
        return scan;
      });

      await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      // Error handling without console log
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
              
              // Update scan history
              await updateScanHistory(selectedPhotos);
              
              setSelectedPhotos(new Set());
              Alert.alert('Success', 'Selected photos have been deleted.');
            } catch (error) {
              // Error handling without console log
              Alert.alert('Error', 'Failed to delete selected photos.');
            }
          },
        },
      ],
    );
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedPhotos(new Set());
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'lowQuality':
        return (
          <LowQualityPhotoList
            photos={lowQualityPhotos}
            selectedPhotos={selectedPhotos}
            onPhotoSelect={togglePhotoSelection}
            onDeleteSelected={deleteSelectedPhotos}
          />
        );
      case 'similar':
        return (
          <SimilarPhotosList
            photos={similarPhotos}
            selectedPhotos={selectedPhotos}
            onPhotoSelect={togglePhotoSelection}
            onDeleteSelected={deleteSelectedPhotos}
          />
        );
      case 'duplicate':
        return (
          <DuplicatePhotoList
            photos={duplicatePhotos}
            selectedPhotos={selectedPhotos}
            onPhotoSelect={togglePhotoSelection}
            onDeleteSelected={deleteSelectedPhotos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.subtitle}>
          Found {lowQualityPhotos.length} low quality photos, {similarPhotos.length} similar photos, and {duplicatePhotos.length} duplicate photos out of {totalScanned} total
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lowQuality' && styles.activeTab]}
          onPress={() => switchTab('lowQuality')}
        >
          <Text style={[styles.tabText, activeTab === 'lowQuality' && styles.activeTabText]}>
            Low Quality ({lowQualityPhotos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'similar' && styles.activeTab]}
          onPress={() => switchTab('similar')}
        >
          <Text style={[styles.tabText, activeTab === 'similar' && styles.activeTabText]}>
            Similar Photos ({similarPhotos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'duplicate' && styles.activeTab]}
          onPress={() => switchTab('duplicate')}
        >
          <Text style={[styles.tabText, activeTab === 'duplicate' && styles.activeTabText]}>
            Duplicates ({duplicatePhotos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
}); 