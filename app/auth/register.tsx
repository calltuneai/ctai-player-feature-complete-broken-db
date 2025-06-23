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
import { Mail, Lock, User, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Eye, EyeOff } from 'lucide-react-native';
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
  const [registrationStep, setRegistrationStep] = useState<'validating' | 'creating' | 'complete'>('validating');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
      if (isSubmitted) {
        setError('Registration already submitted. Please check your email for verification or try signing in.');
        router.replace('/auth/login');
        return;
      }

      setLoading(true);
      setRegistrationStep('validating');
      setError(null);

      if (!firstName || !lastName || !email || !password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      if (!validateEmail(email)) {
        setError('Please enter a valid email address. Disposable email services are not allowed.');
        setLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      setRegistrationStep('creating');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (authError.message.includes('Password should be')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (authData.user) {
        setRegistrationStep('complete');
        setIsSubmitted(true);
        setShowSuccessMessage(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration');
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
        {/* Compact Header */}
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

        {showSuccessMessage ? (
          // Success State - Compact
          <View style={styles.successContainer}>
            <CheckCircle2 size={40} color="#4CD964" />
            <Text style={styles.successTitle}>Account Created!</Text>
            <Text style={styles.successText}>
              Check your email to verify your account, then sign in to start using the app.
            </Text>
            
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.successButtonText}>Continue to Sign In</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          // Form State - Compact
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
                {loading ? (
                  registrationStep === 'validating' ? 'Validating...' :
                  registrationStep === 'creating' ? 'Creating Account...' :
                  'Account Created!'
                ) : 'Create Account'}
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
        )}
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
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontFamily: 'Orbitron-Medium',
    color: BRAND_COLORS.brightBlue,
    fontSize: 16,
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
    alignItems: 'center',
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
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 16,
    padding: 24,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron-Bold',
    color: '#4CD964',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CD964',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 6,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
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