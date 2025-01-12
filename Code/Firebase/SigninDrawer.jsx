import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Pressable,
    useColorScheme,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { createUserWithEmail, loginUserWithEmail } from './UserLogics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome'; // Ensure FontAwesome is installed
import appleAuth, { AppleButton } from '@invertase/react-native-apple-authentication';



const SignInDrawer = ({ visible, onClose, selectedTheme, message }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);

    const colorScheme = useColorScheme(); // Returns 'light' or 'dark'

    const isDarkMode = colorScheme === 'dark';
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '409137828081-ig2uul01r95lj9fu6l1jgbgrp1es9060.apps.googleusercontent.com', // Replace with your web client ID
            offlineAccess: true, // If you need to retrieve refresh tokens
        });
    }, [])
    
    
    async function onAppleButtonPress() {
        try {
          // Start the sign-in request
          const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
          });
      
          const { identityToken, nonce } = appleAuthRequestResponse;
      
          if (!identityToken) {
            throw new Error('Apple Sign-In failed - no identity token returned');
          }
      
          // Create a Firebase credential with the token
          const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
      
          // Sign in with Firebase using the credential
          const userCredential = await auth().signInWithCredential(appleCredential);
          await onClose()
          // Login successful, show alert and close drawer
          Alert.alert('Login Successful', `Welcome, ${userCredential.user.displayName || 'User'}!`);
         
          console.log('User signed in:', userCredential);
        } catch (error) {
          // Login failed, show error alert
          Alert.alert('Login Failed', error.message || 'An unknown error occurred.');
          console.error('Error during Apple Sign-In:', error);
        }
      }
    async function signInWithGoogle() {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();
        // Try the new style of google-sign in result, from v13+ of that module
        idToken = signInResult.data?.idToken;

        if (!idToken) {
            // if you are using older versions of google-signin, try old style result
            idToken = signInResult.idToken;
        }
        if (!idToken) {
            throw new Error('No ID token found');
        }

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(signInResult.data.idToken);

        // Sign-in the user with the credential
        return auth().signInWithCredential(googleCredential);
    }

   
    
    const handleSignInOrRegister = async () => {
        if (!email || !password) {
            alert('Input Error', 'Please enter both email and password.');
            return;
        }
    
        setIsLoadingSecondary(true); // Show loading indicator
    
        try {
            if (isRegisterMode) {
                // Handle user registration
                await createUserWithEmail(email, password);
                Alert.alert('Success', 'Your account has been created successfully!');
                onClose(); // Close the modal after successful registration
            } else {
                // Handle user login
                await loginUserWithEmail(email, password);
                Alert.alert('Success', 'You have logged in successfully!');
                onClose(); // Close the modal after successful login
            }
        } catch (error) {
            console.error('Authentication Error:', error); // Log the error for debugging
    
            // Default error message
            let errorMessage = 'An unexpected error occurred. Please try again later.';
    
            // Map Firebase error codes to user-friendly messages
            if (error?.code === 'auth/invalid-email') {
                errorMessage = 'The email address is not valid.';
            } else if (error?.code === 'auth/user-disabled') {
                errorMessage = 'This user account has been disabled.';
            } else if (error?.code === 'auth/user-not-found') {
                errorMessage = 'No user found with this email.';
            } else if (error?.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error?.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use.';
            } else if (error?.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. Please use a stronger password.';
            }
    
            // Show the alert with the appropriate error message
            Alert.alert('Authentication Error', errorMessage);
        } finally {
            setIsLoadingSecondary(false); // Hide loading indicator
        }
    };
    
    

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
            onClose()
            alert('Signed in with Google');
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            alert(`Google Sign-In Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable style={styles.modalOverlay} onPress={onClose} />
            <Pressable onPress={() => { }}>
                <View style={[styles.drawer, { backgroundColor: isDarkMode ? '#3B404C' : 'white' }]}>
                    <Text style={[styles.title, { color: selectedTheme.colors.text }]}>{isRegisterMode ? 'Register' : 'Sign In'}</Text>
                    <View>
                        <Text style={[styles.text, { color: selectedTheme.colors.text }]}>
                            {message}
                        </Text>
                    </View>

                                      <TextInput
                        style={[styles.input, {color:selectedTheme.colors.text}]}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={[styles.input, {color:selectedTheme.colors.text}]}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSignInOrRegister}
                        disabled={isLoadingSecondary}
                    >


                         {isLoadingSecondary ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                 <Text style={styles.primaryButtonText}>
                            {isRegisterMode ? 'Register' : 'Sign In'}
                        </Text>
                            </>
                        )}
                      
                    </TouchableOpacity>
                    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={[styles.textoR, {color:selectedTheme.colors.text}]}>OR</Text>
      <View style={styles.line} />
    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading} // Disable button while loading
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Icon name="google" size={24} color="white" style={styles.googleIcon} />
                                <Text style={styles.googleButtonText}>Sign in with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {Platform.OS === 'ios' &&
                    
                    <AppleButton
                    buttonStyle={isDarkMode ?  AppleButton.Style.WHITE : AppleButton.Style.BLACK}
                    buttonType={AppleButton.Type.SIGN_IN}
                    style={styles.applebUUTON}
                    onPress={() => onAppleButtonPress().then(() => console.log('Apple sign-in complete!'))}
                  />}



                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setIsRegisterMode(!isRegisterMode)}

                    >
                        <Text style={styles.secondaryButtonText}>
                            {isRegisterMode ? 'Switch to Sign In' : 'Switch to Register'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
        // height: 400,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: 'grey',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    secondaryButton: {
        padding: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    secondaryButtonText: {
        color: '#007BFF',
        textDecorationLine: 'underline',
    },
    googleButton: {
        flexDirection: 'row', // Ensures the icon and text are in a row
        alignItems: 'center', // Vertically centers the content
        justifyContent: 'center', // Centers content horizontally
        backgroundColor: '#DB4437', // Google brand red color
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        height:50,


    },
    applebUUTON:{
        height:50,
       width: '100%',
       marginBottom:10,
    },
    googleIcon: {
        marginRight: 10, // Space between the icon and the text
    },
    googleButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeText: {
        color: 'white',
    },
    text: {
        alignSelf: 'center',
        fontSize: 12,
        paddingVertical: 3,
        marginBottom: 10
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10, // Adjust spacing
      },
      line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc', // Adjust color
      },
      textoR: {
        marginHorizontal: 10, // Spacing around the text
        fontSize: 16,
        fontWeight: 'bold',
      },
});

export default SignInDrawer;
