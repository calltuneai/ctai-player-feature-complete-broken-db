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
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, ChevronRight, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const disposableEmailRegex = /@(tempmail.com|throwawaymail.com|mailinator.com|guerrillamail.com|sharklasers.com|grr.la|guerrillamail.net|spam4.me|byom.de|dispostable.com|yopmail.com|10minutemail.com)$/i;
    return emailRegex.test(email) && !disposableEmailRegex.test(email);
  }

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const openTermsAndConditions = () => {
    Linking.openURL('https://calltuneai.com/terms').catch((err) => {
      console.error('Error opening terms URL:', err);
    });
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://calltuneai.com/privacy').catch((err) => {
      console.error('Error opening privacy URL:', err);
    });
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!firstName || !lastName || !email || !password) {
        setError('Please fill in all required fields');
        return;
      }

      if (!termsAccepted) {
        setError('You must agree to the Terms and Conditions to create an account');
        return;
      }
      
      if (!validateEmail(email)) {
        setError('Please enter a valid email address. Disposable email services are not allowed.');
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Get user's IP address for legal tracking (optional)
      let userIP = null;
      try {
        if (Platform.OS === 'web') {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          userIP = ipData.ip;
        }
      } catch (ipError) {
        console.log('Could not get IP address:', ipError);
        // Continue without IP - not critical
      }

      // Use direct redirect to login page for both web and mobile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            terms_accepted_at: new Date().toISOString(),
            terms_version: '1.0',
            terms_ip_address: userIP
          },
          // Direct redirect to login page with verification parameter
          emailRedirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/auth/login?verified=true`
            : 'calltuneai://auth/login?verified=true'
        }
      });

      if (authError) {
        // Handle specific error cases with clear, actionable messages
        if (authError.message.includes('User already registered') || 
            authError.message.includes('already been registered') ||
            authError.message.includes('email address is already registered')) {
          setError(`This email address is already registered. Please sign in instead or use a different email address.`);
        } else if (authError.message.includes('Password should be')) {
          setError('Password must be at least 6 characters long');
        } else if (authError.message.includes('Invalid email')) {
          setError('Please enter a valid email address');
        } else if (authError.message.includes('Signup is disabled')) {
          setError('Account registration is temporarily disabled. Please try again later.');
        } else if (authError.message.includes('Email rate limit exceeded')) {
          setError('Too many registration attempts. Please wait a few minutes before trying again.');
        } else {
          // Generic fallback with helpful suggestion
          setError(`Registration failed: ${authError.message}. If this email is already registered, please try signing in instead.`);
        }
        return;
      }

      if (authData.user) {
        // Registration successful - redirect to login with a message
        router.replace('/auth/login?message=check_email');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Handle network or unexpected errors
      if (err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prominent Branding Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <DynamicText style={styles.brandTitle}>CallTuneAI</DynamicText>
          <DynamicText style={styles.brandSubtitle}>Player</DynamicText>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <DynamicText style={styles.title}>Create Account</DynamicText>
          <View style={styles.subtitleContainer}>
            <DynamicText style={styles.subtitle}>Free to use — no credit card required.</DynamicText>
            <DynamicText style={styles.subtitle}>Upload your own sounds.</DynamicText>
            <DynamicText style={styles.subtitle}>Play to any Bluetooth device.</DynamicText>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Name Fields */}
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <User size={18} color="#AAAAAA" />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#AAAAAA"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <User size={18} color="#AAAAAA" />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#AAAAAA"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Mail size={18} color="#AAAAAA" />
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

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Lock size={18} color="#AAAAAA" />
            <TextInput
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setShowPasswordHints(text.length > 0);
              }}
              secureTextEntry={!showPassword}
              onFocus={() => setShowPasswordHints(password.length > 0)}
              onBlur={() => setShowPasswordHints(false)}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} color="#AAAAAA" />
              ) : (
                <Eye size={18} color="#AAAAAA" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Password Hints - Only show when needed */}
          {showPasswordHints && (
            <View style={styles.passwordHints}>
              <Text style={[
                styles.passwordHint,
                password.length >= 6 ? styles.passwordHintValid : styles.passwordHintInvalid
              ]}>
                • At least 6 characters
              </Text>
            </View>
          )}

          {/* Terms and Conditions Agreement */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
              disabled={loading}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={openTermsAndConditions}>
                    Terms and Conditions
                  </Text>
                  <Text style={styles.termsText}> and </Text>
                  <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                    Privacy Policy
                  </Text>
                  <Text style={styles.termsText}>. I confirm that I will only upload sounds that I own or have permission to use. I understand that I am responsible for ensuring all uploaded content complies with copyright laws and that CallTuneAI is not liable for any copyright violations.</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              (loading || !termsAccepted) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading || !termsAccepted}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.buttonText,
              !termsAccepted && styles.buttonTextDisabled
            ]}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
            {!loading && termsAccepted && <ChevronRight size={18} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Sign In Link - Improved spacing */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 60, // Increased bottom padding for better spacing
  },
  header: {
    alignItems: 'center',
    marginBottom: 24, // Reduced from 32
  },
  logo: {
    width: 100, // Slightly smaller
    height: 100,
    marginBottom: 12, // Reduced from 16
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 28, // Slightly smaller
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: 'Orbitron-Medium',
    color: BRAND_COLORS.brightBlue,
    fontSize: 20, // Slightly smaller
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: 8,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#FF3B30',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14, // Reduced from 16
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48, // Slightly smaller
    marginBottom: 14, // Reduced from 16
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 6,
  },
  passwordHints: {
    marginTop: -10, // Reduced from -12
    marginBottom: 14, // Reduced from 16
    paddingHorizontal: 4,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  passwordHintValid: {
    color: '#4CD964',
  },
  passwordHintInvalid: {
    color: '#FF3B30',
  },
  termsContainer: {
    marginBottom: 20, // Reduced from 24
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    backgroundColor: 'transparent',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.brightBlue,
    borderColor: BRAND_COLORS.brightBlue,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    lineHeight: 18,
  },
  termsLink: {
    color: BRAND_COLORS.brightBlue,
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0496FF',
    borderRadius: 8,
    height: 48, // Slightly smaller
    marginBottom: 20, // Increased from 16 for better spacing
    gap: 6,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(4, 150, 255, 0.5)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12, // Increased padding for better touch target
    marginBottom: 20, // Added bottom margin for safe area
  },
  linkText: {
    color: '#0496FF',
    fontSize: 15,
    fontFamily: 'Inter-Medium'
  },
});