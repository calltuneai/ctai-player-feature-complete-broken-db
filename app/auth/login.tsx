import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { storeAuthData } from '../../lib/auth';
import { Mail, Lock, ChevronRight, CircleAlert as AlertCircle, Eye, EyeOff, CircleCheck as CheckCircle } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

const BRAND_COLORS = {
  deepBlue: '#2C3E50',
  accentBlue: '#0496FF',
  brightBlue: '#00A6FF',
  lightGray: '#D3D3D3',
};

export default function LoginScreen() {
  const router = useRouter();
  const { message } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState<'check_email' | 'verified'>('check_email');

  useEffect(() => {
    if (message === 'check_email') {
      setMessageType('check_email');
      setShowMessage(true);
      // Auto-hide the message after 10 seconds
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (message === 'verified') {
      setMessageType('verified');
      setShowMessage(true);
      // Auto-hide the verified message after 5 seconds
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError('Please enter your email and password');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email to verify your account before signing in.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.session) {
        // Check if user is verified
        const { data: userData } = await supabase
          .from('users')
          .select('is_verified')
          .eq('id', data.session.user.id)
          .single();

        const isVerified = userData?.is_verified || false;
        
        // Store auth data for offline access
        await storeAuthData(data.session, isVerified);
        
        if (isVerified) {
          router.replace('/(tabs)');
        } else {
          setError('Please verify your email address before signing in.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const getMessageContent = () => {
    if (messageType === 'verified') {
      return {
        icon: <CheckCircle size={16} color="#4CD964" />,
        title: 'Email Verified!',
        subtitle: 'Your account is now verified. You can sign in below.',
        color: '#4CD964'
      };
    } else {
      return {
        icon: <CheckCircle size={16} color="#4CD964" />,
        title: 'Account Created!',
        subtitle: 'Check your email to verify your account, then sign in below.',
        color: '#4CD964'
      };
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Consistent Branding Header - Same as Register */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <DynamicText style={styles.brandTitle}>CallTuneAI</DynamicText>
          <DynamicText style={styles.brandSubtitle}>Player</DynamicText>
        </View>

        {/* Title Section - Same spacing as Register */}
        <View style={styles.titleSection}>
          <DynamicText style={styles.title}>Welcome Back</DynamicText>
          <DynamicText style={styles.subtitle}>Sign in to continue using CallTuneAI</DynamicText>
        </View>

        {/* Status Message */}
        {showMessage && (
          <View style={[styles.messageContainer, { borderColor: `${getMessageContent().color}50` }]}>
            {getMessageContent().icon}
            <View style={styles.messageText}>
              <Text style={[styles.messageTitle, { color: getMessageContent().color }]}>
                {getMessageContent().title}
              </Text>
              <Text style={styles.messageSubtitle}>
                {getMessageContent().subtitle}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowMessage(false)}
              style={styles.dismissButton}
            >
              <Text style={[styles.dismissText, { color: getMessageContent().color }]}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Display - Same style as Register */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form - Same layout as Register */}
        <View style={styles.form}>
          {/* Email Field - Same style as Register */}
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

          {/* Password Field - Same style as Register */}
          <View style={styles.inputContainer}>
            <Lock size={18} color="#AAAAAA" />
            <TextInput
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Submit Button - Same style as Register */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
            {!loading && <ChevronRight size={18} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Register Link - Same style as Register */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? Create one
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
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    marginLeft: 8,
  },
  messageTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  messageSubtitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
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
  form: {
    width: '100%',
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
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#0496FF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Medium',
  },
});