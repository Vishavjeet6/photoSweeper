import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ResultsScreen({ route, navigation }) {
  // Ensure route.params exists and has the expected structure
  const params = route?.params || {};
  const results = params.results || { 
    lowQualityPhotos: [], 
    similarPhotos: [], 
    duplicatePhotos: [], 
    totalScanned: 0 
  };
  
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [activeTab, setActiveTab] = useState('lowQuality');
  const [scanHistory, setScanHistory] = useState([]);

  // Ensure results has all required properties
  const safeResults = {
    ...results,
    lowQualityPhotos: results.lowQualityPhotos || [],
    similarPhotos: results.similarPhotos || [],
    duplicatePhotos: results.duplicatePhotos || [],
    totalScanned: results.totalScanned || 0,
  };

  useEffect(() => {
    // Load scan history
    const loadScanHistory = async () => {
      try {
        const historyJson = await AsyncStorage.getItem('scanHistory');
        if (historyJson) {
          const history = JSON.parse(historyJson);
          setScanHistory(history);
        }
      } catch (error) {
        console.error('Error loading scan history:', error);
      }
    };

    loadScanHistory();
  }, []);

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
      setScanHistory(updatedHistory);
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
              
              // Update scan history
              await updateScanHistory(selectedPhotos);
              
              setSelectedPhotos(new Set());
              Alert.alert('Success', 'Selected photos have been deleted.');
              
              // Refresh the screen with updated data
              navigation.setParams({
                results: {
                  ...safeResults,
                  lowQualityPhotos: safeResults.lowQualityPhotos.filter(
                    photo => !selectedPhotos.has(photo.id)
                  ),
                }
              });
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'lowQuality':
        return (
          <FlatList
            data={safeResults.lowQualityPhotos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.photoGrid}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No low quality photos found</Text>
              </View>
            }
          />
        );
      case 'similar':
        return (
          <ScrollView style={styles.scrollView}>
            {safeResults.similarPhotos && safeResults.similarPhotos.length > 0 ? (
              safeResults.similarPhotos.map((group) => (
                <View key={group.id} style={styles.similarGroup}>
                  <Text style={styles.groupTitle}>
                    {group.duplicates.length + 1} Similar Photos
                  </Text>
                  <FlatList
                    data={[group.original, ...group.duplicates]}
                    renderItem={renderPhoto}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.photoGrid}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No similar photos found</Text>
              </View>
            )}
          </ScrollView>
        );
      case 'duplicate':
        return (
          <FlatList
            data={safeResults.duplicatePhotos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.photoGrid}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No duplicate photos found</Text>
              </View>
            }
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
          Found {safeResults.lowQualityPhotos.length} low quality photos, 
          {safeResults.similarPhotos.length} similar groups, and 
          {safeResults.duplicatePhotos.length} duplicates out of {safeResults.totalScanned} total
        </Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lowQuality' && styles.activeTab]}
          onPress={() => setActiveTab('lowQuality')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'lowQuality' && styles.activeTabText,
            ]}
          >
            Low Quality ({safeResults.lowQualityPhotos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'similar' && styles.activeTab]}
          onPress={() => setActiveTab('similar')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'similar' && styles.activeTabText,
            ]}
          >
            Similar Photos ({safeResults.similarPhotos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'duplicate' && styles.activeTab]}
          onPress={() => setActiveTab('duplicate')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'duplicate' && styles.activeTabText,
            ]}
          >
            Duplicates ({safeResults.duplicatePhotos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}

      {selectedPhotos.size > 0 && (
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
  tabBar: {
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
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
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
    padding: 10,
  },
  photoName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  photoSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  similarGroup: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
}); 