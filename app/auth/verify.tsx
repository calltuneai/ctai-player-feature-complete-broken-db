import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

export default function VerifyScreen() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (token_hash && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash as string,
            type: 'signup'
          });

          if (error) {
            console.error('Verification error:', error);
            setErrorMessage(error.message);
            setVerificationStatus('error');
          } else {
            setVerificationStatus('success');
          }
        } catch (err: any) {
          console.error('Verification error:', err);
          setErrorMessage(err.message || 'An error occurred during verification');
          setVerificationStatus('error');
        }
      } else {
        setVerificationStatus('success');
      }
    };

    verifyEmail();
  }, [token_hash, type]);

  const handleContinue = () => {
    router.replace('/auth/login');
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
            <DynamicText style={styles.buttonText}>Back to Sign In</DynamicText>
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
          Your email has been verified successfully. You can now sign in to your account.
        </DynamicText>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <DynamicText style={styles.buttonText}>Continue to Sign In</DynamicText>
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
});