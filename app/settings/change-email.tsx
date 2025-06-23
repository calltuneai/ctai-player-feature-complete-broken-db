import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowLeft, Loader } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import DynamicText from '../../components/DynamicText';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function ChangeEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const disposableEmailRegex = /@(tempmail\.com|throwawaymail\.com|mailinator\.com|guerrillamail\.com|sharklasers\.com|grr\.la|guerrillamail\.net|spam4\.me|byom\.de|dispostable\.com|yopmail\.com|10minutemail\.com)$/i;
    return emailRegex.test(email) && !disposableEmailRegex.test(email);
  };

  const handleChangeEmail = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in again to change your email');
        return;
      }

      // Re-authenticate with current credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        setError('Invalid password. Please try again.');
        return;
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: email.toLowerCase(),
      });

      if (updateError) {
        if (updateError.message.includes('already registered')) {
          setError('This email address is already in use');
        } else {
          setError(updateError.message);
        }
        return;
      }

      if (Platform.OS === 'web') {
        alert('Verification email sent. Please check your inbox and verify your new email address.');
      } else {
        Alert.alert(
          'Verification Email Sent',
          'Please check your inbox and verify your new email address. You may need to sign in again after verification.',
          [{ text: 'OK', onPress: handleBack }]
        );
      }
    } catch (err: any) {
      console.error('Error changing email:', err);
      setError(err.message || 'An error occurred while updating your email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <DynamicText style={styles.title} numberOfLines={1}>Change Email</DynamicText>
              <DynamicText style={styles.subtitle} numberOfLines={1}>Update Your Account Email</DynamicText>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Email Address</Text>
            <Text style={styles.sectionDescription}>
              Enter your new email address. You'll need to verify it before the change takes effect.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new email address"
                  placeholderTextColor="#AAAAAA"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <Text style={styles.inputDescription}>
                Confirm your current password to authorize this change
              </Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#AAAAAA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                You'll receive a verification email at your new address
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Your email won't change until you verify the new address
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                You may need to sign in again after verification
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleChangeEmail}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Loader size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Updating Email...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Update Email Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.deepBlue,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 24,
    zIndex: 1,
    padding: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    marginTop: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  formSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoBullet: {
    color: BRAND_COLORS.brightBlue,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});