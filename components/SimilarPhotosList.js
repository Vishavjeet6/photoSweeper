import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function SimilarPhotosList({ photos, selectedPhotos, onPhotoSelect, onDeleteSelected }) {
  const [similarGroups, setSimilarGroups] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    if (photos && photos.length > 0) {
      if (photos.some(photo => photo.hasOwnProperty('isOriginal'))) {
        processPreProcessedPhotos();
      } else {
        analyzeSimilarPhotos();
      }
    } else {
      setIsAnalyzing(false);
    }
  }, [photos]);

  const processPreProcessedPhotos = () => {
    const groups = {};
    photos.forEach(photo => {
      if (photo.isOriginal) {
        if (!groups[photo.id]) {
          groups[photo.id] = [photo];
        }
      } else if (photo.originalId) {
        if (!groups[photo.originalId]) {
          groups[photo.originalId] = [];
        }
        groups[photo.originalId].push(photo);
      }
    });
    
    const groupArray = Object.values(groups).filter(group => group.length > 1);
    setSimilarGroups(groupArray);
    setIsAnalyzing(false);
  };

  const analyzeSimilarPhotos = () => {
    const timeGroups = groupPhotosByTime(photos);
    const groups = timeGroups.filter(group => group.length > 1);
    setSimilarGroups(groups);
    setIsAnalyzing(false);
  };

  const groupPhotosByTime = (photos) => {
    const groups = [];
    const sortedPhotos = [...photos].sort((a, b) => a.creationTime - b.creationTime);
    let currentGroup = [];
    let lastTime = null;

    for (const photo of sortedPhotos) {
      if (lastTime === null || photo.creationTime - lastTime <= 60000) {
        currentGroup.push(photo);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [photo];
      }
      lastTime = photo.creationTime;
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const getRecommendedPhoto = (group) => {
    return group.reduce((best, current) => {
      const bestPixels = best.width * best.height;
      const currentPixels = current.width * current.height;
      return currentPixels > bestPixels ? current : best;
    });
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Analyzing photos...</Text>
      </View>
    );
  }

  if (similarGroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No similar photos found</Text>
      </View>
    );
  }

  const hasSelectedPhotos = selectedPhotos && selectedPhotos.size > 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {similarGroups.map((group, groupIndex) => {
          const recommended = getRecommendedPhoto(group);
          return (
            <View key={groupIndex} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>
                Similar Group {groupIndex + 1} ({group.length} photos)
              </Text>
              <View style={styles.photoGrid}>
                {group.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={[
                      styles.photoContainer,
                      selectedPhotos.has(photo.id) && styles.selectedPhoto,
                      photo.id === recommended.id && styles.recommendedPhoto,
                    ]}
                    onPress={() => onPhotoSelect(photo.id)}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                    {photo.id === recommended.id && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Best</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {hasSelectedPhotos && (
        <View style={styles.footer}>
          <Text style={styles.selectionText}>
            {selectedPhotos.size} photos selected
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDeleteSelected}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  groupContainer: {
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPhoto: {
    borderColor: '#2196F3',
  },
  recommendedPhoto: {
    borderColor: '#4CAF50',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 