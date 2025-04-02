import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Button, Card, Avatar, Text, useTheme } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../apis/api';

const UserDetailScreen = ({ navigation, route, setIsLoggedIn }) => {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [weeks, setWeeks] = useState([]);
    const { colors } = useTheme(); // Use theme colors from react-native-paper

    useEffect(() => {
        fetchUserDetails();
    }, [selectedMonth, selectedYear]);

    const fetchUserDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return Alert.alert('Error', 'Not authenticated');

            const response = await api.getUserById(userId, token, selectedMonth, selectedYear);
            if (response.success) {
                setUser(response.data?.user_info);
                setWeeks(response?.data?.weekly_summaries || []);
            } else {
                if (response.status === 401) {
                    AsyncStorage.clear();
                    setIsLoggedIn(false);
                } else {
                    Alert.alert('Error', response.message);
                }
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch user data');
        }
        setLoading(false);
    };

    const renderWeekCard = ({ item }) => (
        <Card style={styles.weekCard}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.weekText}>
                    Week: {new Date(item.week_start).toLocaleDateString()} - {new Date(item.week_end).toLocaleDateString()}
                </Text>

            </Card.Content>
            <Card.Actions>
                <Button mode="contained"
                    onPress={() => navigation.navigate('UserWeeklySummaries', { weekId: item.week_id })}
                >
                    View Details
                </Button>
            </Card.Actions>
        </Card>
    );



    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Filter Component */}
            <View style={styles.filterContainer}>
                <View style={styles.pickerContainer}>
                    <Text style={styles.filterLabel}>Month</Text>
                    <Picker
                        selectedValue={selectedMonth}
                        onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                        style={styles.picker}
                        dropdownIconColor={colors.primary}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <Picker.Item key={month} label={`Month ${month}`} value={month} style={{ color: 'black' }} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.pickerContainer}>
                    <Text style={styles.filterLabel}>Year</Text>
                    <Picker
                        selectedValue={selectedYear}
                        onValueChange={(itemValue) => setSelectedYear(itemValue)}
                        style={styles.picker}
                        dropdownIconColor={colors.primary}
                    >
                        {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <Picker.Item key={year} label={`Year ${year}`} value={year} style={{ color: 'black' }} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* User Details */}
            <Card style={styles.userCard}>
                <Card.Title
                    title={`Full Name : ${user?.full_name}`}
                    subtitle={user?.role}
                />
                <Card.Content>
                    <Text variant="bodyMedium" style={styles.info}>Email: {user?.email}</Text>
                    <Text variant="bodyMedium" style={styles.info}>Username: {user?.username}</Text>
                </Card.Content>
            </Card>

            {/* Weekly Summaries */}
            <Text variant="titleLarge" style={styles.sectionTitle}>Weekly Summaries</Text>
            {weeks.length > 0 ? (
                <FlatList
                    data={weeks}
                    renderItem={renderWeekCard}
                    keyExtractor={(item) => item.week_id}
                    contentContainerStyle={styles.weekList}
                />
            ) : (
                <Text variant="bodyMedium" style={styles.emptyText}>No weekly summaries available.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    userCard: { marginBottom: 20, borderRadius: 12, elevation: 3 },
    info: { marginBottom: 8, color: '#555' },
    sectionTitle: { marginBottom: 16, fontWeight: 'bold', color: '#222' },
    weekCard: { marginBottom: 16, borderRadius: 12, elevation: 3 },
    weekText: { marginBottom: 8 },
    weekList: { paddingBottom: 20 },
    emptyText: { textAlign: 'center', marginVertical: 20, color: 'gray' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    pickerContainer: { flex: 1, marginHorizontal: 8, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 },
    filterLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    picker: { backgroundColor: '#fff', borderRadius: 8 },
});

export default UserDetailScreen;