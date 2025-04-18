import React, { useState } from 'react';
import { View, Alert, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../apis/api';
import Logo from "../assets/Logo.png";

const ForgotPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const validateInputs = () => {
        if (!email) {
            Alert.alert('Error', 'Email is required!');
            return false;
        }


        return true;
    };

    const handleLogin = async () => {
        if (!validateInputs()) { return; }
        setLoading(true);
        const formattedEmail = email.toLowerCase().trim();
        try {
            const response = await api.forgotPassword(formattedEmail);
            if (response.success) {
                Alert.alert('Success', 'reset password link sent your email successfully!');
                setEmail('');
                navigation.navigate('Login')
            } else {
                Alert.alert('Error', response.message || 'Reset Password failed');
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
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="email-address"
                    />



                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        style={styles.button}
                        loading={loading}
                    >
                        Send password reset email
                    </Button>
                    <View style={styles.bottomLinks}>
                        <Button onPress={() => navigation.navigate('Login')} mode="text">Go to Login</Button>

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

export default ForgotPassword;
