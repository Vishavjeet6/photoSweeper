import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

class ImageSimilarityService {
  constructor() {
    this.model = null;
    this.encodingMap = new Map();
    this.batchSize = 32;
    this.minSimilarityThreshold = 0.85;
  }

  async initialize() {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Load MobileNet model
      this.model = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      
      console.log('ImageSimilarityService initialized successfully');
    } catch (error) {
      console.error('Error initializing ImageSimilarityService:', error);
      throw error;
    }
  }

  async preprocessImage(imageUri) {
    try {
      // Resize image to 224x224 (MobileNet input size)
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert image to tensor
      const response = await fetch(manipResult.uri);
      const imageData = await response.blob();
      const imageTensor = await tf.image.decodeImage(imageData);
      
      // Normalize pixel values to [-1, 1]
      const normalized = imageTensor.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1));
      
      // Add batch dimension
      const batched = normalized.expandDims(0);
      
      return batched;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw error;
    }
  }

  async getImageFeatures(imageUri) {
    try {
      const imageTensor = await this.preprocessImage(imageUri);
      
      // Get features from MobileNet
      const features = this.model.infer(imageTensor, { embedding: true });
      
      // Clean up tensors
      imageTensor.dispose();
      
      return features;
    } catch (error) {
      console.error('Error getting image features:', error);
      throw error;
    }
  }

  async findDuplicates(photos) {
    try {
      const duplicates = [];
      const processedPhotos = new Set();

      for (let i = 0; i < photos.length; i++) {
        if (processedPhotos.has(photos[i].uri)) continue;

        const currentPhoto = photos[i];
        const currentFeatures = await this.getImageFeatures(currentPhoto.uri);
        
        const similarPhotos = [];
        
        for (let j = i + 1; j < photos.length; j++) {
          if (processedPhotos.has(photos[j].uri)) continue;
          
          const comparePhoto = photos[j];
          const compareFeatures = await this.getImageFeatures(comparePhoto.uri);
          
          const similarity = this.calculateCosineSimilarity(currentFeatures, compareFeatures);
          
          if (similarity >= this.minSimilarityThreshold) {
            similarPhotos.push({
              ...comparePhoto,
              similarity
            });
            processedPhotos.add(comparePhoto.uri);
          }
          
          // Clean up tensors
          compareFeatures.dispose();
        }
        
        if (similarPhotos.length > 0) {
          duplicates.push({
            original: currentPhoto,
            duplicates: similarPhotos
          });
          processedPhotos.add(currentPhoto.uri);
        }
        
        // Clean up tensors
        currentFeatures.dispose();
      }
      
      return duplicates;
    } catch (error) {
      console.error('Error finding duplicates:', error);
      throw error;
    }
  }

  calculateCosineSimilarity(features1, features2) {
    const dotProduct = tf.sum(tf.mul(features1, features2));
    const norm1 = tf.sqrt(tf.sum(tf.square(features1)));
    const norm2 = tf.sqrt(tf.sum(tf.square(features2)));
    
    const similarity = dotProduct.div(tf.mul(norm1, norm2));
    
    // Clean up tensors
    dotProduct.dispose();
    norm1.dispose();
    norm2.dispose();
    
    return similarity.dataSync()[0];
  }

  findDuplicatesToRemove(duplicateGroups) {
    const toRemove = [];
    
    for (const group of duplicateGroups) {
      const { original, duplicates } = group;
      
      // Sort duplicates by file size (largest first)
      const sortedDuplicates = [...duplicates].sort((a, b) => b.fileSize - a.fileSize);
      
      // Keep the largest file, mark others for removal
      toRemove.push(...sortedDuplicates.slice(1).map(photo => ({
        ...photo,
        originalUri: original.uri
      })));
    }
    
    return toRemove;
  }
}

export default new ImageSimilarityService(); 