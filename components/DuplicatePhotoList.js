import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';

export default function DuplicatePhotoList({ 
  photos, 
  selectedPhotos, 
  onPhotoSelect, 
  onDeleteSelected 
}) {
  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.photoContainer,
        selectedPhotos.has(item.id) && styles.selectedPhoto,
        item.isOriginal && styles.originalPhoto,
      ]}
      onPress={() => onPhotoSelect(item.id)}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoName} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.photoSize}>
          {(item.size / 1024).toFixed(1)} KB
        </Text>
        <Text style={item.isOriginal ? styles.originalLabel : styles.duplicateLabel}>
          {item.isOriginal ? 'Original' : 'Duplicate'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {photos.length > 0 ? (
        <>
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.photoGrid}
          />
          <View style={styles.footer}>
            <Text style={styles.selectionText}>
              {selectedPhotos.size} photos selected
            </Text>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                selectedPhotos.size === 0 && styles.deleteButtonDisabled,
              ]}
              onPress={onDeleteSelected}
              disabled={selectedPhotos.size === 0}
            >
              <Text style={styles.deleteButtonText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No duplicate photos found
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoGrid: {
    padding: 10,
  },
  photoContainer: {
    flex: 1,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectedPhoto: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  originalPhoto: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  photo: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  photoInfo: {
    padding: 8,
  },
  photoName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  photoSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  originalLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  duplicateLabel: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 2,
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
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 