import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowLeft, Loader, CircleCheck as CheckCircle } from 'lucide-react-native';
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
  const [success, setSuccess] = useState(false);

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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in again to change your email');
        return;
      }

      // Check if the new email is the same as current
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        setError('This is already your current email address');
        return;
      }

      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        setError('Invalid password. Please try again.');
        return;
      }

      // Update email with proper redirect URL
      const { error: updateError } = await supabase.auth.updateUser({
        email: email.toLowerCase(),
      }, {
        emailRedirectTo: 'https://calltuneai.com/auth/verify'
      });

      if (updateError) {
        if (updateError.message.includes('already registered') || 
            updateError.message.includes('already been registered')) {
          setError('This email address is already in use by another account');
        } else if (updateError.message.includes('rate limit')) {
          setError('Too many email change requests. Please wait a few minutes before trying again.');
        } else {
          setError(updateError.message);
        }
        return;
      }

      // Success - show confirmation
      setSuccess(true);
      setError(null);

    } catch (err: any) {
      console.error('Error changing email:', err);
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
              <DynamicText style={styles.title} numberOfLines={1}>Email Update</DynamicText>
              <DynamicText style={styles.subtitle} numberOfLines={1}>Verification Required</DynamicText>
            </View>
          </View>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <CheckCircle size={48} color="#4CD964" />
          </View>
          
          <Text style={styles.successTitle}>Verification Email Sent!</Text>
          
          <Text style={styles.successText}>
            We've sent a verification email to <Text style={styles.emailText}>{email}</Text>. 
            Please check your inbox and click the verification link to complete the email change.
          </Text>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Next Steps:</Text>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>1.</Text>
              <Text style={styles.instructionText}>Check your email inbox (and spam folder)</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>2.</Text>
              <Text style={styles.instructionText}>Click the verification link in the email</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>3.</Text>
              <Text style={styles.instructionText}>Your email will be updated after verification</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>4.</Text>
              <Text style={styles.instructionText}>You may need to sign in again with your new email</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleBack}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
                <Text style={styles.buttonText}>Sending Verification...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Send Verification Email</Text>
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
    lineHeight: 20,
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
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Orbitron-Bold',
    color: '#4CD964',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: BRAND_COLORS.brightBlue,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionBullet: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: BRAND_COLORS.brightBlue,
    marginRight: 12,
    minWidth: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: BRAND_COLORS.brightBlue,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});