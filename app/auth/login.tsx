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
import { storeAuthData } from '../../lib/auth';
import { Mail, Lock, ChevronRight, CircleAlert as AlertCircle, Loader, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue using CallTuneAI
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#AAAAAA" />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
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
                    <EyeOff size={20} color="#AAAAAA" />
                  ) : (
                    <Eye size={20} color="#AAAAAA" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Loader size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Signing In...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.buttonText}>Sign In</Text>
                <ChevronRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

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
  passwordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
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
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#0496FF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  }
});