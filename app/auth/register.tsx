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

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const disposableEmailRegex = /@(tempmail.com|throwawaymail.com|mailinator.com|guerrillamail.com|sharklasers.com|grr.la|guerrillamail.net|spam4.me|byom.de|dispostable.com|yopmail.com|10minutemail.com)$/i;
    return emailRegex.test(email) && !disposableEmailRegex.test(email);
  }

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!firstName || !lastName || !email || !password) {
        setError('Please fill in all required fields');
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

      // Use direct redirect to login page for both web and mobile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
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
      <View style={styles.content}>
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
          <DynamicText style={styles.subtitle}>Use it free for a limited time</DynamicText>
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

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
            {!loading && <ChevronRight size={18} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 32,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: 'Orbitron-Medium',
    color: BRAND_COLORS.brightBlue,
    fontSize: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
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
    marginBottom: 16,
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
    height: 50,
    marginBottom: 16,
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
    marginTop: -12,
    marginBottom: 16,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0496FF',
    borderRadius: 8,
    height: 50,
    marginBottom: 16,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#0496FF',
    fontSize: 15,
    fontFamily: 'Inter-Medium'
  },
});