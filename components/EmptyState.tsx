import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Volume2, Upload } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// CallTuneAI brand colors
const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

// CallTuneAI logo URL
const LOGO_URL = 'https://calltuneai.com/calltuneai-predator-hunting-audio-logo.png';

interface EmptyStateProps {
  type: 'library' | 'favorites' | 'search';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const router = useRouter();

  const getContent = () => {
    switch (type) {
      case 'library':
        return {
          icon: <Image source={{uri: LOGO_URL}} style={styles.logoImage} />,
          title: 'Your sound library is empty',
          description: 'Upload your CallTuneAI-generated predator calling sounds to get started.',
          buttonText: 'Upload Sounds',
          action: () => router.push('/upload')
        };
      case 'favorites':
        return {
          icon: <Volume2 size={64} color={BRAND_COLORS.brightBlue} />,
          title: 'No favorite sounds yet',
          description: 'Mark sounds as favorites to find them quickly.',
          buttonText: 'Browse Library',
          action: () => router.push('/')
        };
      case 'search':
        return {
          icon: <Volume2 size={64} color={BRAND_COLORS.brightBlue} />,
          title: 'No matching sounds',
          description: 'Try a different search term or category filter.',
          buttonText: 'Clear Search',
          action: () => {} // This would be passed in from parent
        };
      default:
        return {
          icon: <Image source={{uri: LOGO_URL}} style={styles.logoImage} />,
          title: 'No sounds available',
          description: 'Upload your CallTuneAI-generated predator calling sounds to get started.',
          buttonText: 'Upload Sounds',
          action: () => router.push('/upload')
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {content.icon}
      </View>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>
      <TouchableOpacity style={styles.button} onPress={content.action}>
        <Text style={styles.buttonText}>{content.buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: BRAND_COLORS.deepBlue,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(4, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: BRAND_COLORS.brightBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default EmptyState;