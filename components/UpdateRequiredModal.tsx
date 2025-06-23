import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { ExternalLink, Smartphone, Download } from 'lucide-react-native';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

interface UpdateRequiredModalProps {
  visible: boolean;
  message: string;
  onClose?: () => void; // Optional - for testing purposes only
}

const UpdateRequiredModal: React.FC<UpdateRequiredModalProps> = ({ 
  visible, 
  message, 
  onClose 
}) => {
  const handleUpdatePress = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/calltuneai-player/id123456789', // Replace with actual App Store URL
      android: 'https://play.google.com/store/apps/details?id=com.calltuneai.player', // Replace with actual Play Store URL
      default: 'https://calltuneai.com/download' // Fallback for web
    });

    Linking.openURL(storeUrl).catch((err) => {
      console.error('Error opening store URL:', err);
      // Fallback to website
      Linking.openURL('https://calltuneai.com');
    });
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://calltuneai.com').catch((err) => {
      console.error('Error opening website:', err);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Update Required</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Features highlight */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's New:</Text>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Enhanced audio quality</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Improved performance</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>New premium features</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdatePress}
            >
              <Download size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.websiteButton}
              onPress={handleVisitWebsite}
            >
              <ExternalLink size={20} color={BRAND_COLORS.brightBlue} />
              <Text style={styles.websiteButtonText}>Visit CallTuneAI.com</Text>
            </TouchableOpacity>
          </View>

          {/* Debug close button - only show in development */}
          {__DEV__ && onClose && (
            <TouchableOpacity 
              style={styles.debugCloseButton}
              onPress={onClose}
            >
              <Text style={styles.debugCloseText}>Close (Debug Only)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Background decoration */}
        <View style={styles.backgroundDecoration}>
          <Smartphone size={200} color="rgba(4, 150, 255, 0.1)" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLORS.brightBlue,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: BRAND_COLORS.brightBlue,
    gap: 8,
  },
  websiteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: BRAND_COLORS.brightBlue,
  },
  debugCloseButton: {
    marginTop: 20,
    padding: 8,
  },
  debugCloseText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FF3B30',
    textAlign: 'center',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: '10%',
    right: '-10%',
    zIndex: -1,
    opacity: 0.3,
  },
});

export default UpdateRequiredModal;