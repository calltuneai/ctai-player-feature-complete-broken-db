import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Mail, ChevronRight, CircleAlert as AlertCircle, Loader, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email) {
        setError('Please enter your email address');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmail = async () => {
    if (Platform.OS === 'web') {
      // For web, try to open domain-specific email clients
      const emailDomain = email.toLowerCase().split('@')[1];
      let emailUrl = '';
      
      if (emailDomain?.includes('gmail.com')) {
        emailUrl = 'https://mail.google.com';
      } else if (emailDomain?.includes('outlook.com') || emailDomain?.includes('hotmail.com') || emailDomain?.includes('live.com')) {
        emailUrl = 'https://outlook.live.com';
      } else if (emailDomain?.includes('yahoo.com')) {
        emailUrl = 'https://mail.yahoo.com';
      } else if (emailDomain?.includes('icloud.com')) {
        emailUrl = 'https://www.icloud.com/mail';
      } else {
        // For other domains, try to use the system's default email handler
        try {
          window.location.href = 'mailto:';
          return;
        } catch (err) {
          // If mailto fails, open Gmail as fallback
          emailUrl = 'https://mail.google.com';
        }
      }
      
      if (emailUrl) {
        window.open(emailUrl, '_blank');
      }
      return;
    }
    
    // For mobile, try to open the default email app
    try {
      const supported = await Linking.canOpenURL('mailto:');
      if (supported) {
        await Linking.openURL('mailto:');
      } else {
        Alert.alert(
          'Email App Not Found',
          'Please check your email manually or install an email app.'
        );
      }
    } catch (err) {
      console.error('Failed to open email app:', err);
      Alert.alert(
        'Error',
        'Could not open email app. Please check your email manually.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {resetSent 
              ? 'Check your email for the reset link'
              : 'Enter your email to receive a reset link'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resetSent ? (
          <View style={styles.successContainer}>
            <CheckCircle size={24} color="#4CD964" />
            <View style={styles.successTextContainer}>
              <Text style={styles.successTitle}>Reset Email Sent!</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to your email address.
              </Text>
              <TouchableOpacity
                style={styles.checkEmailButton}
                onPress={handleOpenEmail}
              >
                <Mail size={20} color="#FFFFFF" />
                <Text style={styles.checkEmailText}>Open Email App</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#AAAAAA"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Loader size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Sending Reset Link...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.linkText}>
            Remember Password? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#FF3B30',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#4CD964',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  checkEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CD964',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  checkEmailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0496FF',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#0496FF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
});