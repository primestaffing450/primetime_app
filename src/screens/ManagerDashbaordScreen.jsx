import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, ScrollView, SafeAreaView, TextInput, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import api from '../apis/api';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';

const ManagerDashboardScreen = ({ navigation, setIsLoggedIn }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [exportData, setExportData] = useState([]);

    useEffect(() => {
        getTokenAndFetchUsers();
    }, []);

    const getTokenAndFetchUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                fetchUsers(token);
                fetchExportUsers(token);
            } else {
                setError('User not authenticated');
                setLoading(false);
            }
        } catch (e) {
            console.log('Error fetching token', e);
            setError('Failed to get access token');
            setLoading(false);
        }
    };

    const fetchUsers = async (token) => {
        if (!token) return;
        const response = await api.getUsers(token);
        if (response.success) {
            setUsers(response.data?.users);
        } else {
            if (response.status === 401) {
                AsyncStorage.clear();
                setIsLoggedIn(false);
            } else {
                Alert.alert('Error', response.message);
            }
            setError(response.message);
        }
        setLoading(false);
    };

    const fetchExportUsers = async (token) => {
        if (!token) return;
        const response = await api.exportExcelUsersData(token);
        if (response.success) {
            setExportData(response.data?.rows);
        } else {
            if (response.status === 401) {
                AsyncStorage.clear();
                setIsLoggedIn(false);
            } else {
                Alert.alert('Error', response.message);
            }
            setError(response.message);
        }
        setLoading(false);
    };



    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading Users...</Text>
            </View>
        );
    }

    // Function to Export Data to Excel
    // const exportToExcel = async () => {
    //     if (users.length === 0) {
    //         Alert.alert("No data", "No users found to export.");
    //         return;
    //     }

    //     // Convert JSON to Worksheet
    //     let dataToExport = exportData.map(user => ({
    //         "Date Submitted": user?.date_submitted || "N.A",
    //         "Name": user?.name || "N.A",
    //         "Email": user?.email || "N.A",
    //         "Date Worked": user?.date_worked || "N.A",
    //         "Time In": user?.time_in || "N.A",
    //         "Time Out": user?.time_out || "N.A",
    //         "Lunch": user?.lunch || "N.A",
    //         "Total Daily Hours": user?.total_daily_hours || "N.A",
    //         "Approve/Reject": user?.approve_reject || "N.A",
    //         "AI Discrepancy Detected (Y/N)": user?.ai_Discrepancy_detected || "N.A",
    //     }));

    //     let ws = XLSX.utils.json_to_sheet(dataToExport);
    //     let wb = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, "Users");

    //     // Write the Excel file
    //     const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

    //     // Convert to buffer
    //     const buf = new ArrayBuffer(wbout.length);
    //     const view = new Uint8Array(buf);
    //     for (let i = 0; i < wbout.length; i++) {
    //         view[i] = wbout.charCodeAt(i) & 0xFF;
    //     }

    //     // File Path (Android & iOS Compatible)
    //     const filePath = RNFS.DownloadDirectoryPath + "/UsersData.xlsx";

    //     // Write File
    //     try {
    //         await RNFS.writeFile(filePath, wbout, 'ascii');
    //         Alert.alert("Success", "Excel file has been downloaded: " + filePath);
    //     } catch (error) {
    //         console.error("File Save Error:", error);
    //         Alert.alert("Error", "Failed to save the file.");
    //     }
    // };


    const exportToExcel = async () => {
        // Check if there is data to export
        if (exportData.length === 0) {
            Alert.alert("No data", "No users found to export.");
            return;
        }

        // Confirmation before export
        Alert.alert(
            "Confirm Export",
            "Are you sure you want to export the data to Excel?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Export cancelled"),
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        // Convert JSON to Worksheet
                        let dataToExport = exportData.map(user => ({
                            "Date Submitted": user?.date_submitted.split('T')[0] || "N.A",
                            "Name": user?.name || "N.A",
                            "Email": user?.email || "N.A",
                            "Date Worked": user?.date_worked || "N.A",
                            "Time In": user?.time_in || "N.A",
                            "Time Out": user?.time_out || "N.A",
                            "Lunch": user?.lunch || "N.A",
                            "Total Daily Hours": user?.total_daily_hours || "N.A",
                            "Approve/Reject": user?.approve_reject || "N.A",
                            "AI Discrepancy Detected (Y/N)": user?.ai_Discrepancy_detected || "N.A",
                        }));

                        let ws = XLSX.utils.json_to_sheet(dataToExport);
                        let wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Users");

                        // Write the Excel file
                        const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

                        // Convert to buffer
                        const buf = new ArrayBuffer(wbout.length);
                        const view = new Uint8Array(buf);
                        for (let i = 0; i < wbout.length; i++) {
                            view[i] = wbout.charCodeAt(i) & 0xFF;
                        }

                        // File Path (Android & iOS Compatible)
                        const fileName = `UsersData_${new Date().toISOString().slice(0, 10)}_${new Date().getTime()}.xlsx`;
                        const filePath = RNFS.DownloadDirectoryPath + "/" + fileName;

                        // Check if file already exists and handle accordingly
                        try {
                            const fileExists = await RNFS.exists(filePath);
                            if (fileExists) {
                                Alert.alert("File Exists", "A file with the same name already exists. A new file will be created with a unique name.");
                            }

                            await RNFS.writeFile(filePath, wbout, 'ascii');
                            Alert.alert("Success", "Excel file has been downloaded: " + filePath);
                        } catch (error) {
                            console.error("File Save Error:", error);
                            Alert.alert("Error", "Failed to save the file.");
                        }
                    }
                }
            ]
        );
    };


    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#666"
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                />
                <Text style={{ fontSize: 20 }}>🔎</Text>
            </View>
            {/* Export Button */}
            <Button mode="contained"
                onPress={exportToExcel}
                style={styles.exportButton}>
                Export to Excel
            </Button>

            {filteredUsers.length > 0 ? (
                <ScrollView horizontal style={styles.horizontalScroll} nestedScrollEnabled>
                    <View style={styles.tableContainer}>
                        {/* Fixed Table Header */}
                        <View style={styles.headerRow}>
                            <Text style={[styles.headerCell, styles.nameColumn]}>Full Name</Text>
                            <Text style={[styles.headerCell, styles.emailColumn]}>Email</Text>
                            <Text style={[styles.headerCell, styles.usernameColumn]}>Username</Text>
                            {/* <Text style={[styles.headerCell, styles.roleColumn]}>Role</Text> */}
                            <Text style={[styles.headerCell, styles.actionColumn]}>Actions</Text>
                        </View>

                        {/* Scrollable Table Content */}
                        <ScrollView style={styles.tableBody} nestedScrollEnabled>
                            <FlatList
                                data={filteredUsers}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item, index }) => (
                                    <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                                        <Text style={[styles.cell, styles.nameColumn]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.full_name}
                                        </Text>
                                        <Text style={[styles.cell, styles.emailColumn]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.email}
                                        </Text>
                                        <Text style={[styles.cell, styles.usernameColumn]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.username}
                                        </Text>
                                        {/* <Text style={[styles.cell, styles.roleColumn]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.role}
                                        </Text> */}
                                        <Button
                                            mode="contained"
                                            onPress={() => navigation.navigate('UserDetailScreen', { userId: item._id })}
                                            style={styles.viewButton}
                                        >
                                            View
                                        </Button>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    </View>
                </ScrollView>
            ) : (
                <Text style={styles.noUsersText}>No users found</Text>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },

    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 10,
        marginVertical: 10,
        // elevation: 3,
        marginHorizontal: Platform.OS === 'android' ? 2 : 10
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingLeft: 10,
        color: '#333',
    },

    // Horizontal ScrollView
    horizontalScroll: {
        flex: 1,
    },
    exportButton: { marginVertical: 10, backgroundColor: '#28a745' },

    // Table Container
    tableContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        overflow: 'hidden',
        marginVertical: 10,
        // marginHorizontal: 10
        marginHorizontal: Platform.OS === 'android' ? 0 : 10
    },

    // Fixed Table Header
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ccc',

    },
    headerCell: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        textAlign: 'center',
    },

    // Scrollable Table Body
    tableBody: {
        maxHeight: 'auto', // Fixed height for table body
    },

    // Table Columns
    nameColumn: { width: 150, textAlign: 'left' },
    emailColumn: { width: 200, textAlign: 'left' },
    usernameColumn: { width: 120, textAlign: 'left' },
    roleColumn: { width: 100, textAlign: 'left' },
    actionColumn: { width: 100, textAlign: 'center' },

    // Alternating Row Colors
    evenRow: { backgroundColor: '#ffffff' },
    oddRow: { backgroundColor: '#f8f9fa' },

    // Row
    row: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    cell: {
        fontSize: 16,
        color: '#333',
        paddingHorizontal: 10,
        paddingVertical: 5,
        textAlign: 'left',
    },

    // Buttons
    viewButton: {
        backgroundColor: '#007bff',
        borderRadius: 10,
    },

    // Loading & Error
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#007bff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { color: 'red', fontSize: 16, textAlign: 'center' },
    noUsersText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#555' },
});

export default ManagerDashboardScreen;

