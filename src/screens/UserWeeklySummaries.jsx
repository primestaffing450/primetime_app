import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../apis/api';
import { Card } from 'react-native-paper';
import { endPoint } from '../config';

const UserWeeklySummaries = ({ route, setIsLoggedIn }) => {
    const { weekId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeeklyTimesheet = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) return Alert.alert('Error', 'Not authenticated');

                const response = await api.getWeeklyTimesheet(weekId, token);
                if (response.success) {
                    setData(response.data);
                } else {
                    if (response.status === 401) {
                        AsyncStorage.clear();
                        setIsLoggedIn(false);
                    } else {
                        setError(response.message || 'Failed to fetch data');
                    }
                }
            } catch (err) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchWeeklyTimesheet();
    }, [weekId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {data && (
                <>
                    {/* Image Section */}
                    <Image source={{ uri: `${endPoint}/${data.image}` }} style={styles.image} />

                    {/* Week Range Section */}
                    <View style={styles.weekRangeContainer}>
                        <Text style={styles.weekRangeText}>
                            Week: {new Date(data?.week_data?.week_start).toLocaleDateString()} - {new Date(data?.week_data?.week_end).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* Overall Validation Status */}
                    {/* <View style={[styles.statusContainer, { backgroundColor: data.overall_validation_status ? '#4CAF50' : '#F44336' }]}>
                        <Text style={styles.statusText}>
                            {data?.overall_validation_status ? 'Approved' : 'Not Approved'}
                        </Text>
                    </View> */}

                    {/* Daily Data Cards */}
                    {data?.week_data?.days.map((day, index) => (
                        <Card key={index} style={styles.card}>
                            <Card.Content>
                                {/* Date */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Date:</Text>
                                    <Text style={styles.valueText}>{new Date(day.date).toLocaleDateString()}</Text>
                                </View>

                                {/* Time In */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Time In:</Text>
                                    <Text style={styles.valueText}>{day.time_in || 'N/A'}</Text>
                                </View>

                                {/* Time Out */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Time Out:</Text>
                                    <Text style={styles.valueText}>{day.time_out || 'N/A'}</Text>
                                </View>

                                {/* Lunch Timeout */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Lunch Timeout:</Text>
                                    <Text style={styles.valueText}>{day.lunch_timeout || 'N/A'} minutes</Text>
                                </View>

                                {/* Total Hours */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Total Hours:</Text>
                                    <Text style={styles.valueText}>{day.total_hours || 'N/A'}</Text>
                                </View>

                                {/* Status */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>AI Validation Status:</Text>
                                    <Text style={[styles.valueText, { color: day?.ai_validation_info?.status === 'missing from image' ? '#F44336' : '#000' }]}>
                                        {day?.ai_validation_info?.status || 'N/A'}
                                    </Text>
                                </View>

                                {/* Validation Info Status */}
                                <View style={styles.row}>
                                    <Text style={styles.keyText}>Reason:</Text>
                                    <Text style={[styles.valueText, styles.wrapText]}>
                                        {day?.ai_validation_info?.reason || 'N/A'}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    weekRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
    },
    weekRangeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6200ee',
        marginLeft: 8,
    },
    statusContainer: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    card: {
        marginBottom: 30,
        borderRadius: 10,
        elevation: 3,
        backgroundColor: '#fff',
        overflow: 'hidden', // Ensures content doesn't overflow the card
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
        marginBottom: 8,
        flexWrap: 'wrap', // Allows content to wrap to next line if needed
    },
    keyText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6200ee',
        marginRight: 4,
        flexShrink: 0, // Prevents the key from shrinking
    },
    valueText: {
        fontSize: 14,
        color: '#333',
        flex: 1, // Takes remaining space
    },
    wrapText: {
        flexWrap: 'wrap', // Allows text to wrap
    },
    errorText: {
        color: '#F44336',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default UserWeeklySummaries;