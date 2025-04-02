import React, { useState } from 'react';
import { View, Alert, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../apis/api';
import Logo from "../assets/Logo.png";

const LoginScreen = ({ navigation, setIsLoggedIn, setRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateInputs = () => {
        if (!email || !password) {
            Alert.alert('Error', 'All fields are required!');
            return false;
        }


        return true;
    };

    const handleLogin = async () => {
        if (!validateInputs()) { return; }
        setLoading(true);
        const formattedEmail = email.toLowerCase().trim();
        try {
            const response = await api.login(formattedEmail, password);
            if (response.success) {
                Alert.alert('Success', 'Logged in SuccessFully...');
                await AsyncStorage.setItem('userToken', response?.data?.access_token);
                await AsyncStorage.setItem('role', response?.data?.user_data?.role);
                setRole(response?.data?.user_data?.role)
                setIsLoggedIn(true);
                setEmail('');
                setPassword('');
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <View style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row' }}>
                        <Image source={Logo} style={{ height: 70, marginBottom: 10 }} resizeMode="contain" />

                    </View>
                    <TextInput
                        label="Email or Username"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="email-address"
                    />

                    <TextInput
                        label="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        mode="outlined"
                    />

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        style={styles.button}
                        loading={loading}
                    >
                        Login
                    </Button>

                    <View style={styles.bottomLinks}>
                        <Button onPress={() => navigation.navigate('Register')} mode="text">Create Account</Button>
                        <Button onPress={() => Alert.alert('Forgot Password?', 'Feature coming soon!')} mode="text">
                            Forgot Password?
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    card: {
        width: '90%',
        maxWidth: 400,
        padding: 20,
        borderRadius: 15,
        elevation: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    logo: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginTop: 10,
    },
    bottomLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});

export default LoginScreen;
