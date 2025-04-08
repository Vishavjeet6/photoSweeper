import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width / 2 - 24;

export default function SimilarPhotosList({ photos = [], selectedPhotos = [], onPhotoSelect }) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const renderPhotoItem = ({ item: photo }) => {
    const isSelected = selectedPhotos.includes(photo.uri);
    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => onPhotoSelect(photo)}
      >
        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoName}>{photo.filename}</Text>
          <Text style={styles.similarityText}>
            {Math.round((photo.similarity || 0) * 100)}% similar
          </Text>
        </View>
        <View style={styles.checkbox}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? '#2196F3' : '#999'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item: group }) => {
    if (!group || !group.duplicates) return null;
    
    const isExpanded = expandedGroups.has(group.id);
    return (
      <View style={styles.groupContainer}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleGroup(group.id)}
        >
          <View style={styles.groupInfo}>
            <Text style={styles.groupTitle}>
              {group.duplicates.length + 1} Similar Photos
            </Text>
            <Text style={styles.groupSubtitle}>
              Original: {group.original?.filename || 'Unknown'}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.groupContent}>
            <FlatList
              data={group.duplicates}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.uri}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>
    );
  };

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No similar photos found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      renderItem={renderGroup}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  groupContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  groupContent: {
    padding: 8,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  photoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  photoName: {
    fontSize: 14,
    color: '#333',
  },
  similarityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    marginLeft: 12,
  },
}); 