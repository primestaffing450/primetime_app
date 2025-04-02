import React, { useState } from 'react';
import { View, Alert, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import api from '../apis/api';
import Logo from "../assets/Logo.png";

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateInputs = () => {
        if (!fullName || !username || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'All fields are required!');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Alert.alert('Error', 'Invalid email format!');
            return false;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters!');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateInputs()) { return; }
        setLoading(true);

        const formattedEmail = email.toLowerCase().trim();
        try {
            const response = await api.register(username, formattedEmail, password, fullName);
            if (response.success) {
                Alert.alert('Success', 'Registration Successful! Please login.');
                navigation.navigate('Login');
                setFullName('');
                setUsername('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
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
                    <Text variant="headlineMedium" style={styles.logo}>Create Account</Text>

                    <TextInput
                        label="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                        style={styles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Email"
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

                    <TextInput
                        label="Confirm Password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={styles.input}
                        mode="outlined"
                    />

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        style={styles.button}
                        loading={loading}
                    >
                        GET STARTED
                    </Button>

                    <View style={styles.bottomLinks}>
                        <Button onPress={() => navigation.navigate('Login')} mode="text">
                            Already have an account? Login
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
        justifyContent: 'center',
        marginTop: 10,
    },
});

export default RegisterScreen;
