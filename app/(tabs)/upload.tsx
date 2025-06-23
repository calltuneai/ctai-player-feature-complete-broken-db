import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload as UploadIcon, Plus, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useSounds } from '../../context/SoundContext';
import { Sound, SoundCategory } from '../../types/sound';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
  darkBackground: '#1A1A1A',
};

export default function UploadScreen() {
  const router = useRouter();
  const { addSound } = useSounds();
  const [soundName, setSoundName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SoundCategory>('Distress');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    duration: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories: SoundCategory[] = ['Distress', 'Predator', 'Prey', 'Other'];

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      return () => {};
    }, [])
  );

  const resetForm = () => {
    setSoundName('');
    setDescription('');
    setCategory('Distress');
    setTags([]);
    setCurrentTag('');
    setSelectedFile(null);
    setIsUploading(false);
  };

  const pickSound = async () => {
    try {
      if (Platform.OS === 'web') {
        alert("File picking is not fully supported in the web preview. This would allow selecting audio files on a real device.");
        
        const mockFile = {
          uri: 'https://example.com/sample-audio.mp3',
          name: 'Sample Predator Call.mp3',
          size: 1024 * 1024 * 2,
          duration: 45,
        };
        
        setSelectedFile(mockFile);
        setSoundName('Sample Predator Call');
        return;
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validAudioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];
      
      if (!fileExtension || !validAudioExtensions.includes(fileExtension)) {
        Alert.alert('Invalid File', 'Please select a valid audio file.');
        return;
      }
      
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      
      const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
      
      const defaultName = file.name.replace(/\.[^/.]+$/, "");
      setSoundName(defaultName);
      
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        size: fileInfo.size || 0,
        duration: duration,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      if (Platform.OS === 'web') {
        alert('Failed to select audio file.');
      } else {
        Alert.alert('Error', 'Failed to select audio file.');
      }
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      if (Platform.OS === 'web') {
        alert('Please select an audio file to upload.');
      } else {
        Alert.alert('Missing File', 'Please select an audio file to upload.');
      }
      return;
    }
    
    if (!soundName.trim()) {
      if (Platform.OS === 'web') {
        alert('Please provide a name for your sound.');
      } else {
        Alert.alert('Missing Name', 'Please provide a name for your sound.');
      }
      return;
    }
    
    try {
      setIsUploading(true);
      
      const newSound: Sound = {
        id: Date.now().toString(),
        name: soundName.trim(),
        description: description.trim(),
        duration: selectedFile.duration,
        uri: selectedFile.uri,
        size: selectedFile.size,
        dateAdded: new Date().toISOString(),
        category: category,
        favorite: false,
        tags: tags,
      };
      
      await addSound(newSound);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (Platform.OS === 'web') {
        if (confirm('Your sound has been added to the library. Go to Library or Upload Another?')) {
          router.push('/');
        } else {
          resetForm();
        }
      } else {
        Alert.alert(
          'Upload Successful',
          'Your sound has been added to the library.',
          [
            {
              text: 'Go to Library',
              onPress: () => router.push('/'),
            },
            {
              text: 'Upload Another',
              onPress: () => {
                resetForm();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error uploading sound:', error);
      if (Platform.OS === 'web') {
        alert('There was an error adding your sound.');
      } else {
        Alert.alert('Upload Failed', 'There was an error adding your sound.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Upload Sound</Text>
            <Text style={styles.subtitle}>Add to Your Library</Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.uploadArea} 
          onPress={pickSound}
          disabled={isUploading}
        >
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
              <View style={styles.fileInfoRow}>
                <Text style={styles.fileInfoText}>{formatFileSize(selectedFile.size)}</Text>
                <Text style={styles.fileInfoText}>{formatDuration(selectedFile.duration)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.changeFileButton}
                onPress={pickSound}
              >
                <Text style={styles.changeFileButtonText}>Change File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.uploadIconContainer}>
                <UploadIcon size={32} color={BRAND_COLORS.brightBlue} />
              </View>
              <Text style={styles.uploadText}>Tap to select an audio file</Text>
              <Text style={styles.uploadSubtext}>MP3, WAV, M4A, AAC, OGG</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Sound Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={soundName}
              onChangeText={setSoundName}
              placeholder="Enter sound name"
              placeholderTextColor="#AAAAAA"
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter sound description"
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategoryButton
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.selectedCategoryButtonText
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="Add tags"
                placeholderTextColor="#AAAAAA"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={addTag}
                disabled={!currentTag.trim()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.uploadButton, (!selectedFile || !soundName.trim() || isUploading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!selectedFile || !soundName.trim() || isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Adding to Library...' : 'Add to Library'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.deepBlue,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: BRAND_COLORS.brightBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  uploadArea: {
    backgroundColor: BRAND_COLORS.deepBlue,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(4, 150, 255, 0.3)',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(4, 150, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
  },
  selectedFileContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selectedFileName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  fileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fileInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    marginHorizontal: 8,
  },
  changeFileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
    borderRadius: 8,
  },
  changeFileButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: BRAND_COLORS.brightBlue,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: BRAND_COLORS.deepBlue,
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.deepBlue,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: BRAND_COLORS.brightBlue,
  },
  categoryButtonText: {
    color: '#AAAAAA',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: BRAND_COLORS.deepBlue,
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: BRAND_COLORS.brightBlue,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 150, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 6,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadButton: {
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(4, 150, 255, 0.5)',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});