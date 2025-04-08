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
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { manipulateAsync } from 'expo-image-manipulator';

export default function SimilarPhotosList({ photos, selectedPhotos, onPhotoSelect, onDeleteSelected }) {
  const [similarGroups, setSimilarGroups] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    analyzeSimilarPhotos();
  }, [photos]);

  const analyzeSimilarPhotos = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Group photos by time (within 1 minute)
      const timeGroups = groupPhotosByTime(photos);
      
      // Analyze visual similarity within each time group
      const groups = [];
      let processedCount = 0;
      const totalPhotos = photos.length;

      for (const group of timeGroups) {
        if (group.length > 1) {
          const similarPhotos = await analyzeVisualSimilarity(group);
          if (similarPhotos.length > 0) {
            groups.push(similarPhotos);
          }
        }
        processedCount += group.length;
        setProgress(processedCount / totalPhotos);
      }

      setSimilarGroups(groups);
    } catch (error) {
      console.error('Error analyzing similar photos:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const groupPhotosByTime = (photos) => {
    const groups = [];
    const sortedPhotos = [...photos].sort((a, b) => a.creationTime - b.creationTime);

    let currentGroup = [];
    let lastTime = null;

    for (const photo of sortedPhotos) {
      if (lastTime === null || photo.creationTime - lastTime <= 60000) { // 1 minute
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

  const analyzeVisualSimilarity = async (photos) => {
    const similarPhotos = [];
    const processedPhotos = new Set();

    for (let i = 0; i < photos.length; i++) {
      if (processedPhotos.has(photos[i].id)) continue;

      const currentGroup = [photos[i]];
      processedPhotos.add(photos[i].id);

      for (let j = i + 1; j < photos.length; j++) {
        if (processedPhotos.has(photos[j].id)) continue;

        const similarity = await comparePhotos(photos[i], photos[j]);
        if (similarity > 0.85) { // 85% similarity threshold
          currentGroup.push(photos[j]);
          processedPhotos.add(photos[j].id);
        }
      }

      if (currentGroup.length > 1) {
        similarPhotos.push(currentGroup);
      }
    }

    return similarPhotos;
  };

  const comparePhotos = async (photo1, photo2) => {
    try {
      // Compare basic properties
      const sizeSimilarity = Math.min(photo1.fileSize, photo2.fileSize) / Math.max(photo1.fileSize, photo2.fileSize);
      const dimensionSimilarity = Math.min(photo1.width * photo1.height, photo2.width * photo2.height) /
                                Math.max(photo1.width * photo1.height, photo2.width * photo2.height);

      // If basic properties are very different, photos are likely not similar
      if (sizeSimilarity < 0.7 || dimensionSimilarity < 0.7) {
        return 0;
      }

      // For more accurate comparison, we would use TensorFlow.js here
      // But for now, we'll use a combination of basic properties
      return (sizeSimilarity + dimensionSimilarity) / 2;
    } catch (error) {
      console.error('Error comparing photos:', error);
      return 0;
    }
  };

  const getRecommendedPhoto = (group) => {
    // Recommend the photo with the highest resolution
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
        <Text style={styles.loadingText}>
          Analyzing photos... {Math.round(progress * 100)}%
        </Text>
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

  return (
    <ScrollView style={styles.container}>
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
}); 