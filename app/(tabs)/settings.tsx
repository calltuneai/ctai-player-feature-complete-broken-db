import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Platform, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bluetooth, Volume2, Moon, Shield, Wand as Wand2, Radio, Crown, ChevronRight, TriangleAlert as AlertTriangle, Move3d, Waves, User, LogOut, Mail } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { getUserSettings, createUserSettings, updateUserSettings } from '../../lib/check-user';
import { useRouter } from 'expo-router';
import { useSounds } from '../../context/SoundContext';
import * as Haptics from 'expo-haptics';
import DynamicText from '../../components/DynamicText';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
  darkBackground: '#1A1A1A',
  premiumGold: '#FFD700',
};

const LOGO_URL = 'https://calltuneai.com/calltuneai-predator-hunting-audio-logo.png';

// Hide trial UI for now - can be toggled when ready to monetize
const SHOW_TRIAL_INFO = false;

export default function SettingsScreen() {
  const { sounds, deleteSound, highQualityEnabled, setHighQualityEnabled } = useSounds();
  const router = useRouter();
  const [keepScreenOn, setKeepScreenOn] = useState(true);
  const [bluetoothAutoConnect, setBluetoothAutoConnect] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      setUserData(profile);

      // Fetch user settings
      const settings = await getUserSettings(user.id);
      if (settings) {
        setUserSettings(settings);
        setHighQualityEnabled(settings.high_quality_enabled ?? true);
        setKeepScreenOn(settings.keep_screen_on ?? true);
        setBluetoothAutoConnect(settings.bluetooth_auto_connect ?? true);
      } else {
        // Create default settings
        const defaultSettings = {
          high_quality_enabled: true,
          bluetooth_auto_connect: true,
          keep_screen_on: true,
        };
        const newSettings = await createUserSettings(user.id, defaultSettings);
        setUserSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleToggle = async (setting: string, value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let updateData: any = {};
    
    switch (setting) {
      case 'keepScreenOn':
        setKeepScreenOn(value);
        updateData.keep_screen_on = value;
        break;
      case 'bluetoothAutoConnect':
        setBluetoothAutoConnect(value);
        updateData.bluetooth_auto_connect = value;
        break;
      case 'highQualityPlayback':
        setHighQualityEnabled(value);
        updateData.high_quality_enabled = value;
        break;
    }

    // Update settings in database
    try {
      await updateUserSettings(user.id, updateData);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleUpgrade = () => {
    Linking.openURL('https://calltuneai.com');
  };

  const handleChangeEmail = () => {
    router.push('/settings/change-email');
  };

  const handleClearLibrary = () => {
    Alert.alert(
      "⚠️ Danger Zone",
      "Are you absolutely sure you want to delete all sounds? This action CANNOT be undone!",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes, Delete Everything", 
          onPress: () => {
            Alert.alert(
              "Final Warning",
              "This will permanently delete ALL your sounds. Type DELETE to confirm.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "DELETE",
                  onPress: () => {
                    sounds.forEach(sound => deleteSound(sound.id));
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    Alert.alert("Library Cleared", "All sounds have been removed.");
                  },
                  style: "destructive"
                }
              ]
            );
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={{uri: LOGO_URL}} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleContainer}>
            <DynamicText style={styles.title} numberOfLines={1}>Settings</DynamicText>
            <DynamicText style={styles.subtitle} numberOfLines={1}>Customize Your Experience</DynamicText>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          {loading ? (
            <ActivityIndicator color={BRAND_COLORS.brightBlue} />
          ) : userData ? (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <User size={32} color={BRAND_COLORS.brightBlue} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userData.first_name} {userData.last_name}</Text>
                  <Text style={styles.profileEmail}>{userData.email}</Text>
                </View>
              </View>
              
              <View style={styles.profileDetails}>
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Verification Status</Text>
                  <Text style={[styles.detailValue, userData.is_verified ? styles.active : styles.expired]}>
                    {userData.is_verified ? 'Verified' : 'Pending Verification'}
                  </Text>
                </View>
                
                {/* Only show trial info if SHOW_TRIAL_INFO is true */}
                {SHOW_TRIAL_INFO && (
                  <>
                    <View style={styles.profileDetail}>
                      <Text style={styles.detailLabel}>Trial Status</Text>
                      <Text style={[styles.detailValue, userData.is_trial_expired ? styles.expired : styles.active]}>
                        {userData.is_trial_expired ? 'Expired' : 'Active'}
                      </Text>
                    </View>
                    {!userData.is_trial_expired && userData.trial_end && (
                      <View style={styles.profileDetail}>
                        <Text style={styles.detailLabel}>Trial Ends</Text>
                        <Text style={styles.detailValue}>
                          {new Date(userData.trial_end).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <LogOut size={20} color="#FF3B30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load profile data</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchUserData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Volume2 size={20} color={BRAND_COLORS.brightBlue} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>High Quality Playback</Text>
                <Text style={styles.settingDescription}>
                  Enable enhanced audio processing and playback optimization
                </Text>
              </View>
            </View>
            <Switch
              value={highQualityEnabled}
              onValueChange={(value) => handleToggle('highQualityPlayback', value)}
              trackColor={{ false: '#3A3A3A', true: 'rgba(4, 150, 255, 0.5)' }}
              thumbColor={highQualityEnabled ? BRAND_COLORS.brightBlue : '#AAAAAA'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Bluetooth size={20} color={BRAND_COLORS.brightBlue} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Auto-connect to Bluetooth</Text>
                <Text style={styles.settingDescription}>Automatically connect to last used device</Text>
              </View>
            </View>
            <Switch
              value={bluetoothAutoConnect}
              onValueChange={(value) => handleToggle('bluetoothAutoConnect', value)}
              trackColor={{ false: '#3A3A3A', true: 'rgba(4, 150, 255, 0.5)' }}
              thumbColor={bluetoothAutoConnect ? BRAND_COLORS.brightBlue : '#AAAAAA'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Custom Sounds</Text>
          <Text style={styles.premiumDescription}>
            Transform your calling sounds with AI in our web studio
          </Text>

          <TouchableOpacity style={styles.premiumFeature} onPress={handleUpgrade}>
            <View style={styles.premiumFeatureContent}>
              <View style={styles.premiumIconContainer}>
                <Waves size={24} color={BRAND_COLORS.premiumGold} />
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumFeatureTitle}>AI Sound Processing</Text>
                <Text style={styles.premiumFeatureDescription}>
                  Automatic noise reduction, upscaling, and volume optimization
                </Text>
              </View>
              <Crown size={20} color={BRAND_COLORS.premiumGold} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.premiumFeature} onPress={handleUpgrade}>
            <View style={styles.premiumFeatureContent}>
              <View style={styles.premiumIconContainer}>
                <Move3d size={24} color={BRAND_COLORS.premiumGold} />
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumFeatureTitle}>Motion FX Studio</Text>
                <Text style={styles.premiumFeatureDescription}>
                  Mono and Stero MotionFX: random, ping-pong, and circular
                </Text>
              </View>
              <Crown size={20} color={BRAND_COLORS.premiumGold} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.premiumFeature} onPress={handleUpgrade}>
            <View style={styles.premiumFeatureContent}>
              <View style={styles.premiumIconContainer}>
                <Radio size={24} color={BRAND_COLORS.premiumGold} />
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumFeatureTitle}>High-Frequency Layer</Text>
                <Text style={styles.premiumFeatureDescription}>
                  Add ultrasonic frequencies (25-60kHz) that only predators can hear
                </Text>
              </View>
              <Crown size={20} color={BRAND_COLORS.premiumGold} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Visit CallTuneAI Studio</Text>
            <ChevronRight size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.accountItem}
            onPress={handleChangeEmail}
          >
            <View style={styles.accountItemContent}>
              <View style={styles.iconContainer}>
                <Mail size={20} color={BRAND_COLORS.brightBlue} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Change Email Address</Text>
                <Text style={styles.settingDescription}>Update your account email</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <View style={styles.dangerHeader}>
            <AlertTriangle size={20} color="#FF3B30" />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearLibrary}
          >
            <Text style={styles.dangerButtonText}>Clear Library</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            This will permanently delete all sounds from your library. This action cannot be undone.
          </Text>
        </View>
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
    width: 56, // Standardized size
    height: 56, // Standardized size
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: 16, android: 17, default: 18 }),
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(4, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: Platform.select({ ios: 14, android: 15, default: 16 }),
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    marginTop: 2,
  },
  premiumDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumFeature: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  premiumFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: BRAND_COLORS.premiumGold,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 16,
  },
  upgradeButton: {
    backgroundColor: BRAND_COLORS.premiumGold,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginRight: 8,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerSection: {
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 59, 48, 0.3)',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FF3B30',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF3B30',
  },
  dangerDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FF3B30',
    opacity: 0.7,
    textAlign: 'center',
  },
  profileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(4, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  profileDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  active: {
    color: '#4CD964',
  },
  expired: {
    color: '#FF3B30',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});