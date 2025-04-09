import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [scanHistory, setScanHistory] = useState([]);
  const navigation = useNavigation();

  // Load scan history when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadScanHistory();
    }, [])
  );

  const loadScanHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('scanHistory');
      if (historyJson) {
        const history = JSON.parse(historyJson);
        // Only take the most recent scan
        setScanHistory(history.slice(0, 1));
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const renderScanItem = ({ item }) => {
    let formattedDate = 'Invalid Date';
    try {
      if (item && item.date) {
        const date = new Date(item.date);
        if (!isNaN(date.getTime())) {
          formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
        }
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }

    return (
      <TouchableOpacity
        style={styles.scanItem}
        onPress={() => navigation.navigate('Results', {
          lowQualityPhotos: item.lowQualityPhotos || [],
          duplicatePhotos: item.duplicatePhotos || [],
          similarPhotos: item.similarPhotos || [],
          cnnPhotos: item.cnnPhotos || [],
          totalScanned: item.totalScanned || 0,
        })}
      >
        <Text style={styles.scanDate}>{formattedDate}</Text>
        <Text style={styles.scanStats}>
          Found {item.lowQualityCount || 0} low quality, {item.similarCount || 0} similar, {item.duplicateCount || 0} duplicate, and {item.cnnCount || 0} CNN-analyzed photos out of {item.totalScanned || 0} total
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Sweeper</Text>
      <Text style={styles.subtitle}>
        Clean up your photo library by finding and removing low quality and duplicate photos.
      </Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>Start New Scan</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>Last Scan</Text>
      {scanHistory.length > 0 ? (
        <FlatList
          data={scanHistory}
          renderItem={renderScanItem}
          keyExtractor={(item) => item.date || `scan-${Math.random()}`}
          style={styles.historyList}
        />
      ) : (
        <Text style={styles.noHistoryText}>No previous scans found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  historyList: {
    flex: 1,
  },
  scanItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scanDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  scanStats: {
    fontSize: 14,
    color: '#666',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
}); 