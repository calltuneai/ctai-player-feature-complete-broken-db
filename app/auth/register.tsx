import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
      
      // Get the current URL for redirect
      const currentUrl = Platform.OS === 'web' ? window.location.origin : 'exp://localhost:8081';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          },
          emailRedirectTo: `${currentUrl}/auth/verify`
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <DynamicText style={styles.brandTitle}>CallTuneAI</DynamicText>
          <DynamicText style={styles.brandSubtitle}>Player</DynamicText>
          <DynamicText style={styles.title}>Create Account</DynamicText>
          <DynamicText style={styles.subtitle}>Use it free for a limited time</DynamicText>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {showSuccessMessage && (
          <View style={styles.successContainer}>
            <CheckCircle2 size={24} color="#4CD964" />
            <View style={styles.successTextContainer}>
              <Text style={styles.successTitle}>Account Created Successfully!</Text>
              <Text style={styles.successText}>
                Please check your email to verify your account before signing in. Look for an email from Supabase Auth and click the verification link.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <User size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#AAAAAA"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!showSuccessMessage}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <User size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#AAAAAA"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!showSuccessMessage}
                />
              </View>
            </View>
          </View>

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
                editable={!showSuccessMessage}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#AAAAAA" />
              <TextInput
                style={[styles.input, { marginRight: 40 }]}
                placeholder="Password"
                placeholderTextColor="#AAAAAA"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setShowPasswordHints(true);
                }}
                secureTextEntry={!showPassword}
                onFocus={() => setShowPasswordHints(true)}
                onBlur={() => setShowPasswordHints(false)}
                editable={!showSuccessMessage}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#AAAAAA" />
                ) : (
                  <Eye size={20} color="#AAAAAA" />
                )}
              </TouchableOpacity>
            </View>
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
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || showSuccessMessage) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading || isSubmitted || showSuccessMessage}
          >
            <Text style={styles.buttonText}>
              {loading ? (
                registrationStep === 'validating' ? 'Validating...' :
                registrationStep === 'creating' ? 'Creating Account...' :
                'Account Created!'
              ) : showSuccessMessage ? (
                'Check your Email to Verify'
              ) : 'Create Account'}
            </Text>
            {!loading && !showSuccessMessage && <ChevronRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>

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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 32,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: 48,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontFamily: 'Orbitron-Medium',
    color: BRAND_COLORS.brightBlue,
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
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
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
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
    fontFamily: 'Inter-Medium'
  },
  passwordHints: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  passwordHintValid: {
    color: '#4CD964',
  },
  passwordHintInvalid: {
    color: '#FF3B30',
  },
});