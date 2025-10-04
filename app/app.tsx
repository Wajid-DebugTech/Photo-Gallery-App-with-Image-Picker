// App.js
// ------------------------------------------------------------
// React Native (Expo) demo app: Photo Gallery with Image Picker
// Features:
// - Pick one or multiple photos from device library (expo-image-picker)
// - Display them in a responsive grid (FlatList)
// - Delete any photo from the gallery
// ------------------------------------------------------------
// How to run (Expo):
// 1) npx create-expo-app photo-gallery && cd photo-gallery
// 2) Replace the generated App.js with the contents of this file.
// 3) Install deps:
//    npm i expo-image-picker @expo/vector-icons
// 4) Start: npx expo start
// ------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Type: { id: string, uri: string }
export default function App() {
  const [photos, setPhotos] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);

  // Ask for media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const pickImages = useCallback(async () => {
    if (hasPermission === false) {
      Alert.alert('Permission needed', 'Please enable Photos/Media permission in Settings to pick images.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        selectionLimit: 0, // 0 = no limit (iOS & Web). Android may ignore; returns single asset.
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled) return;

      const assets = result.assets ?? [];
      const mapped = assets.map((a) => ({ id: `${a.assetId || a.uri}-${Date.now()}-${Math.random()}`, uri: a.uri }));
      setPhotos((prev) => [...mapped, ...prev]);
    } catch (err) {
      console.warn('Error picking images', err);
      Alert.alert('Error', 'Could not open image library.');
    }
  }, [hasPermission]);

  const removePhoto = useCallback((id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const confirmDelete = useCallback((id) => {
    Alert.alert('Remove photo', 'Are you sure you want to delete this photo from the gallery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removePhoto(id) },
    ]);
  }, [removePhoto]);

  // Grid calculations
  const numColumns = 3;
  const { width } = Dimensions.get('window');
  const GRID_PADDING = 16; // horizontal padding for list container
  const GAP = 8;
  const tileSize = useMemo(() => {
    const totalGap = GAP * (numColumns - 1);
    const available = width - GRID_PADDING * 2 - totalGap;
    return Math.floor(available / numColumns);
  }, [width]);

  const renderItem = useCallback(({ item }) => (
    <View style={{ width: tileSize, height: tileSize }}>
      <Image source={{ uri: item.uri }} style={[styles.image, { width: tileSize, height: tileSize }]} />
      <Pressable
        onPress={() => confirmDelete(item.id)}
        style={styles.trashBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete photo"
      >
        <Ionicons name="trash" size={16} color="#fff" />
      </Pressable>
    </View>
  ), [tileSize, confirmDelete]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Gallery</Text>
        <TouchableOpacity onPress={pickImages} style={styles.addBtn}>
          <Ionicons name="images" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Photos</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="images-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyBody}>Tap “Add Photos” to select from your library.</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={renderItem}
          removeClippedSubviews
          initialNumToRender={12}
          windowSize={7}
        />
      )}

      {/* Floating add button (visible on scroll) */}
      <TouchableOpacity onPress={pickImages} style={styles.fab}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 8 },
  emptyBody: { fontSize: 14, color: '#6b7280', marginTop: 6 },

  image: { borderRadius: 12, backgroundColor: '#e5e7eb' },
  trashBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
