import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    checkScanHistory();
  }, []);

  const checkScanHistory = async () => {
    try {
      const scanHistoryJson = await AsyncStorage.getItem('scanHistory');
      const scanHistory = scanHistoryJson ? JSON.parse(scanHistoryJson) : [];
      setHasHistory(scanHistory.length > 0);
    } catch (error) {
      console.error('Error checking scan history:', error);
    }
  };

  const handlePreviousScans = async () => {
    try {
      const scanHistoryJson = await AsyncStorage.getItem('scanHistory');
      const scanHistory = scanHistoryJson ? JSON.parse(scanHistoryJson) : [];
      
      if (scanHistory.length > 0) {
        // Navigate to the most recent scan results
        const mostRecentScan = scanHistory[0];
        navigation.navigate('Results', {
          lowQualityPhotos: mostRecentScan.lowQualityPhotos,
          totalScanned: mostRecentScan.totalScanned,
        });
      } else {
        Alert.alert('No Previous Scans', 'Start a new scan to see results.');
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load previous scans.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="photo-library" size={80} color="#4A90E2" />
        <Text style={styles.title}>PhotoSweeper</Text>
        <Text style={styles.subtitle}>Clean up your photo library</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Scan')}
        >
          <MaterialIcons name="search" size={24} color="white" />
          <Text style={styles.buttonText}>Scan Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            !hasHistory && styles.disabledButton
          ]}
          onPress={handlePreviousScans}
        >
          <MaterialIcons name="history" size={24} color="white" />
          <Text style={styles.buttonText}>Previous Scans</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          PhotoSweeper helps you:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={styles.bulletPoint}>• Remove duplicate photos</Text>
          <Text style={styles.bulletPoint}>• Select the best quality photos</Text>
          <Text style={styles.bulletPoint}>• Free up storage space</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  bulletPoints: {
    gap: 5,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 