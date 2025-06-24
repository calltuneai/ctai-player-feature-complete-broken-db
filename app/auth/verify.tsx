import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

export default function VerifyScreen() {
  const router = useRouter();
  const { success, error } = useLocalSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check URL parameters first
    if (success === 'true') {
      setVerificationStatus('success');
      // Auto-redirect to login after showing success briefly
      const timer = setTimeout(() => {
        router.replace('/auth/login?message=verified');
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    if (error) {
      let message = 'An error occurred during verification';
      switch (error) {
        case 'session_error':
          message = 'Failed to establish session. Please try signing in.';
          break;
        case 'verification_failed':
          message = 'Email verification failed. Please try again or contact support.';
          break;
        default:
          message = 'Verification error. Please try again.';
      }
      setErrorMessage(message);
      setVerificationStatus('error');
      return;
    }

    // If no URL parameters, check current session
    const checkVerificationStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if user is verified in database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_verified')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error('Error checking user verification:', userError);
            setErrorMessage('Failed to check verification status');
            setVerificationStatus('error');
            return;
          }
          
          if (userData?.is_verified) {
            setVerificationStatus('success');
            // Auto-redirect to login after showing success briefly
            const timer = setTimeout(() => {
              router.replace('/auth/login?message=verified');
            }, 2000);
            return () => clearTimeout(timer);
          } else {
            setErrorMessage('Email verification is still pending');
            setVerificationStatus('error');
          }
        } else {
          setErrorMessage('No active session found');
          setVerificationStatus('error');
        }
      } catch (err: any) {
        console.error('Verification check error:', err);
        setErrorMessage(err.message || 'Failed to verify email');
        setVerificationStatus('error');
      }
    };

    checkVerificationStatus();
  }, [success, error, router]);

  const handleContinue = () => {
    if (verificationStatus === 'success') {
      router.replace('/auth/login?message=verified');
    } else {
      router.replace('/auth/register');
    }
  };

  if (verificationStatus === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Loader size={48} color="#0496FF" />
          </View>
          <DynamicText style={styles.title}>Verifying Email...</DynamicText>
          <DynamicText style={styles.description}>
            Please wait while we verify your email address.
          </DynamicText>
        </View>
      </View>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.errorIconContainer]}>
            <AlertCircle size={48} color="#FF3B30" />
          </View>
          <DynamicText style={styles.title}>Verification Failed</DynamicText>
          <DynamicText style={styles.description}>
            {errorMessage || 'There was an error verifying your email address. Please try again or contact support.'}
          </DynamicText>
          <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleContinue}>
            <DynamicText style={styles.buttonText}>Back to Sign Up</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={48} color="#4CD964" />
        </View>
        <DynamicText style={styles.title}>Email Verified!</DynamicText>
        <DynamicText style={styles.description}>
          Your email has been verified successfully. Redirecting to sign in...
        </DynamicText>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
          <DynamicText style={styles.skipButtonText}>Continue Now</DynamicText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CD964',
    borderRadius: 2,
    width: '100%',
  },
  button: {
    backgroundColor: '#4CD964',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButton: {
    backgroundColor: '#0496FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#4CD964',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});