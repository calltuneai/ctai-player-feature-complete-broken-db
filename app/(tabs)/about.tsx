import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Mail, Twitter, Instagram, Youtube, Facebook, Play } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import DynamicText from '../../components/DynamicText'; 

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
  darkBackground: '#1A1A1A',
};

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  const handleWatchDemo = () => {
    openLink('https://calltuneai.com/#demo');
  };

  const handleUpgrade = () => {
    openLink('https://calltuneai.com/#pricing');
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
            <DynamicText style={styles.title} numberOfLines={1}>About</DynamicText>
            <DynamicText style={styles.subtitle} numberOfLines={1}>CallTuneAI Player</DynamicText>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/preyr-logo.png')}
            style={styles.preyrLogo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>CallTuneAI</Text>
          <Text style={styles.appSubtitle}>Predator Call Player</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={handleWatchDemo}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.demoButtonText}>Watch Demo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CallTuneAI</Text>
          <Text style={styles.paragraph}>
            CallTuneAI Player is a lightweight app designed to play predator calls — either 
            uploaded by you or synced directly from your CallTuneAI Studio account (coming soon).
            CallTuneAI Studio revolutionizes predator hunting by leveraging cutting-edge AI technology 
            to create the most realistic and effective predator calls available. Our system 
            analyzes and replicates intricate vocalizations with unprecedented accuracy.
          </Text>
          <Text style={styles.paragraph}>
            Created by hunters for hunters, CallTuneAI combines decades of field experience 
            with advanced artificial intelligence to deliver calls that consistently bring 
            predators within range.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pro Features</Text>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>AI-Generated Custom Calls</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Unlimited Sound Generation</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Advanced Sound Editor</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Cloud Library Sync</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Priority Support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREYR Thermal Optics and Gear</Text>
          <Text style={styles.paragraph}>
            As part of the PREYR ecosystem, CallTuneAI Player seamlessly integrates with your 
            calling systems, thermal optics and hunting gear available at our online gear store.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('https://calltuneai.com')}
          >
            <ExternalLink size={20} color="#FFFFFF" />
            <Text style={styles.socialButtonText}>Visit CallTuneAI Website</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('https://preyr.com')}
          >
            <ExternalLink size={20} color="#FFFFFF" />
            <Text style={styles.socialButtonText}>Visit PREYR Website</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('mailto:support@calltuneai.com')}
          >
            <Mail size={20} color="#FFFFFF" />
            <Text style={styles.socialButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.socialIconButton}
              onPress={() => openLink('https://facebook.com/calltuneai')}
            >
              <Facebook size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIconButton}
              onPress={() => openLink('https://twitter.com/calltuneai')}
            >
              <Twitter size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIconButton}
              onPress={() => openLink('https://instagram.com/calltuneai')}
            >
              <Instagram size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIconButton}
              onPress={() => openLink('https://youtube.com/calltuneai')}
            >
              <Youtube size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://calltuneai.com/terms')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <ExternalLink size={20} color="#AAAAAA" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://calltuneai.com/privacy')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ExternalLink size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.copyright}>
          © 2025 CallTuneAI & PREYR. All rights reserved.
        </Text>
      </ScrollView>
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
  preyrLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: BRAND_COLORS.brightBlue,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.brightBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  upgradeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: 16, android: 17, default: 18 }),
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: Platform.select({ ios: 14, android: 15, default: 16 }),
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    lineHeight: 24,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.brightBlue,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  socialIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `rgba(4, 150, 255, 0.2)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  copyright: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 24,
  },
});