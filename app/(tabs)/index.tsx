import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Filter, CreditCard as Edit, Trash2, Share } from 'lucide-react-native';
import { useSounds } from '../../context/SoundContext';
import SoundCard from '../../components/SoundCard';
import EmptyState from '../../components/EmptyState';
import { Sound, SoundCategory } from '../../types/sound';
import * as Haptics from 'expo-haptics';
import DynamicText from '../../components/DynamicText';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function LibraryScreen() {
  const { sounds, deleteSound } = useSounds();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  const categories: SoundCategory[] = ['Distress', 'Predator', 'Prey', 'Other'];

  const filteredSounds = sounds.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory ? sound.category === selectedCategory : true;

    const matchesFavorites = showFavoritesOnly ? sound.favorite : true;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const handleOptionsPress = (sound: Sound) => {
    setSelectedSound(sound);
    setOptionsModalVisible(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDeleteSound = () => {
    if (!selectedSound) return;

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to delete "${selectedSound.name}"?`)) {
        deleteSound(selectedSound.id);
        setOptionsModalVisible(false);
      }
    } else {
      Alert.alert(
        "Delete Sound",
        `Are you sure you want to delete "${selectedSound.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: () => {
              deleteSound(selectedSound.id);
              setOptionsModalVisible(false);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
            style: "destructive"
          }
        ]
      );
    }
  };

  const handleEditSound = () => {
    setOptionsModalVisible(false);
  };

  const handleShareSound = () => {
    setOptionsModalVisible(false);
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilters}>
      <TouchableOpacity
        style={[
          styles.categoryButton,
          selectedCategory === null && !showFavoritesOnly && styles.selectedCategoryButton
        ]}
        onPress={() => {
          setSelectedCategory(null);
          setShowFavoritesOnly(false);
        }}
      >
        <Text style={[
          styles.categoryButtonText,
          selectedCategory === null && !showFavoritesOnly && styles.selectedCategoryButtonText
        ]}>All</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.categoryButton,
          showFavoritesOnly && styles.selectedCategoryButton
        ]}
        onPress={() => {
          setShowFavoritesOnly(!showFavoritesOnly);
          setSelectedCategory(null);
        }}
      >
        <Text style={[
          styles.categoryButtonText,
          showFavoritesOnly && styles.selectedCategoryButtonText
        ]}>Favorites</Text>
      </TouchableOpacity>

      {categories.map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.selectedCategoryButton
          ]}
          onPress={() => {
            setSelectedCategory(selectedCategory === category ? null : category);
            setShowFavoritesOnly(false);
          }}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.selectedCategoryButtonText
          ]}>{category}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
            <DynamicText style={styles.title} numberOfLines={1}>CallTuneAI</DynamicText>
            <DynamicText style={styles.subtitle} numberOfLines={1}>Predator Call Player</DynamicText>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={BRAND_COLORS.lightGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sounds..."
          placeholderTextColor={BRAND_COLORS.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={BRAND_COLORS.lightGray} />
          </TouchableOpacity>
        )}
      </View>

      {renderCategoryFilter()}

      {filteredSounds.length === 0 ? (
        <EmptyState
          type={sounds.length === 0 ? 'library' : (showFavoritesOnly ? 'favorites' : 'search')}
        />
      ) : (
        <FlatList
          data={filteredSounds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SoundCard
              sound={item}
              onOptionsPress={handleOptionsPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {selectedSound && (
              <Text style={styles.modalTitle}>{selectedSound.name}</Text>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={handleEditSound}>
              <Edit size={24} color="#FFFFFF" />
              <Text style={styles.modalOptionText}>Edit Sound Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleShareSound}>
              <Share size={24} color="#FFFFFF" />
              <Text style={styles.modalOptionText}>Share Sound</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleDeleteSound}>
              <Trash2 size={24} color="#FF3B30" />
              <Text style={[styles.modalOptionText, { color: '#FF3B30' }]}>Delete Sound</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: Platform.select({ ios: 20, android: 22, default: 24 }),
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    color: BRAND_COLORS.brightBlue,
    fontSize: Platform.select({ ios: 14, android: 15, default: 16 }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  categoryFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: BRAND_COLORS.brightBlue,
  },
  categoryButtonText: {
    color: BRAND_COLORS.lightGray,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND_COLORS.deepBlue,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#AAAAAA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 16,
  },
});