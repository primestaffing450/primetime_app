import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Platform, PermissionsAndroid, Alert, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import api, { saveDraftTimesheet, uploadTimesheet } from '../apis/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import Logo from "../assets/Logo.png";

const DashboardScreen = ({ navigation, setIsLoggedIn }) => {
    const [days, setDays] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showPickers, setShowPickers] = useState({
        date: false,
        timeIn: false,
        timeOut: false,
        lunch: false
    });
    const [loading, setLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);

    const [accessToken, setAccessToken] = useState('');
    const [image, setImage] = useState(null);

    const [draftData, setDraftData] = useState([]);
    const [uploadedDates, setUploadedDates] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Generate predefined time slots (30-minute intervals from 8 AM to 8 PM)
    const generateTimeSlots = () => {
        const slots = [];
        // Generate all 24 hours (12:00 AM to 11:30 PM)
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 10) { // 30-minute intervals
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12; // Convert 0 to 12
                const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
                slots.push(timeString);
            }
        }
        return slots;
    };
    const TIME_SLOTS = generateTimeSlots();

    const getToken = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setAccessToken(token);
    };

    useEffect(() => {
        getToken();
        fetchDates()
        fetchDraftData()
    }, []);

    const fetchDates = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');

            const datesResponse = await api.getUploadedDates(token);
            if (datesResponse.success) {
                setUploadedDates(datesResponse.data);
                console.log(datesResponse.data, "--dates");
            }
            else {
                if (datesResponse.status === 401) {
                    AsyncStorage.clear();
                    setIsLoggedIn(false);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setRefreshing(false);
        }
    };
    const fetchDraftData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            // Fetch draft data
            const draftResponse = await api.getAllDraftData(token);
            if (draftResponse.success) {
                setDraftData(draftResponse.data);
                console.log(draftResponse, "---");
            }
            else {
                if (draftResponse.status === 401) {
                    AsyncStorage.clear();
                    setIsLoggedIn(false);
                }
            }



        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleDateChange = (selectedDate) => {
        setCurrentDate(selectedDate.toISOString().split('T')[0]);
        setShowPickers({ ...showPickers, date: false });
    };

    const handleDataChange = (field, value) => {
        setDays((prevDays) => ({
            ...prevDays,
            [currentDate]: {
                ...prevDays[currentDate],
                [field]: value,
            },
        }));
    };

    const togglePicker = (picker) => {
        setShowPickers({ ...showPickers, [picker]: !showPickers[picker] });
    };

    const saveAsDraft = async () => {
        if (!days[currentDate]?.timeIn || !days[currentDate]?.timeOut || !days[currentDate]?.totalHours) {
            Alert.alert('Validation Error', 'All fields are required for the current date!');
            return;
        }

        setDraftLoading(true);
        try {
            const formData = new FormData();

            // Add current day's data
            formData.append(`[${currentDate}][time_in]`, days[currentDate].timeIn);
            formData.append(`[${currentDate}][time_out]`, days[currentDate].timeOut);
            formData.append(`[${currentDate}][lunch_timeout]`, days[currentDate].lunch || 0);
            formData.append(`[${currentDate}][total_hours]`, days[currentDate].totalHours);
            formData.append('date', currentDate);

            // Add image if available
            if (image) {
                formData.append('image_file', {
                    uri: image.uri,
                    name: image.fileName || `draft_${Date.now()}.jpg`,
                    type: image.type || 'image/jpeg',
                });
            }

            const response = await saveDraftTimesheet(formData, accessToken);

            if (response.success) {
                Alert.alert('Draft Saved', `Data saved for date: ${currentDate}`);
                setImage(null);
                setDays({});
                fetchDates()
                fetchDraftData()

                // Only advance date if NOT today
                const today = new Date().toISOString().split('T')[0];
                if (currentDate !== today) {
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    setCurrentDate(nextDate.toISOString().split('T')[0]);
                }
            } else {
                if (response.status === 401) {
                    AsyncStorage.clear();
                    setIsLoggedIn(false);
                } else {
                    Alert.alert('Save Failed', response.message);
                }
            }
        } catch (error) {
            Alert.alert('Save Failed', 'There was an error saving the draft.');
        } finally {
            setDraftLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
        if (!result.didCancel && result.assets.length > 0) {
            setImage(result.assets[0]);
        }
    };

    const openCamera = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
            return;
        }
        const result = await launchCamera({ mediaType: 'photo', quality: 1 });
        if (!result.didCancel && result.assets && result.assets.length > 0) {
            setImage(result.assets[0]);
        }
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs access to your camera to take photos.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!days[currentDate]?.timeIn && !days[currentDate]?.timeOut && !days[currentDate]?.totalHours && !image) {
            Alert.alert('Validation Error', 'min one field is required');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(days).forEach(([date, data]) => {
                formData.append(`[${date}][time_in]`, data.timeIn);
                formData.append(`[${date}][time_out]`, data.timeOut);
                formData.append(`[${date}][lunch_timeout]`, data.lunch);
                formData.append(`[${date}][total_hours]`, data.totalHours);
                formData.append('date', currentDate);
            });
            if (image) {
                formData.append('image_file', {
                    uri: image.uri,
                    name: image.fileName || `upload_${Date.now()}.jpg`,
                    type: image.type || 'image/jpeg',
                });
            }
            const response = await uploadTimesheet(formData, accessToken);
            if (response.success) {
                Alert.alert('Success', 'Timesheet uploaded successfully!');
                setDays({});
                setImage(null);
                fetchDates()
                fetchDraftData()
            } else {
                if (response.status === 401) {
                    AsyncStorage.clear();
                    setIsLoggedIn(false);
                } else {
                    Alert.alert('Upload Failed', response.message);
                }
            }
        } catch (error) {
            Alert.alert('Upload Failed', 'There was an error uploading the timesheet.');
        } finally {
            setLoading(false);
        }
    };

    const isDateDisabled = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Disable future dates and already uploaded dates
        return date > today || uploadedDates.includes(dateStr);
    };

    // Custom date picker component
    const renderDatePicker = () => {
        if (!showPickers.date) return null;

        if (Platform.OS === 'android') {
            return (
                <DateTimePicker
                    value={new Date(currentDate)}
                    mode="date"
                    display="calendar"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        if (selectedDate && !isDateDisabled(selectedDate)) {
                            handleDateChange(selectedDate);
                        }
                        setShowPickers({ ...showPickers, date: false });
                    }}
                />
            );
        }

        // iOS implementation with proper date disabling
        return (
            <Modal transparent={true} visible={showPickers.date}>
                <View style={styles.pickerModalContainer}>
                    <View style={styles.pickerContent}>
                        <DateTimePicker
                            value={new Date(currentDate)}
                            mode="date"
                            display="inline"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                                if (selectedDate && !isDateDisabled(selectedDate)) {
                                    handleDateChange(selectedDate);
                                }
                                setShowPickers({ ...showPickers, date: false });
                            }}
                            isDateDisabled={isDateDisabled}
                        />
                        <Button
                            mode="contained"
                            onPress={() => setShowPickers({ ...showPickers, date: false })}
                            style={styles.closeButton}
                        >
                            Close
                        </Button>
                    </View>
                </View>
            </Modal>
        );
    };


    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekendSubmission = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Image source={Logo} style={{ height: 70, marginBottom: 10 }} resizeMode="contain" />

                {/* Date Picker */}
                {/* <View style={styles.inputContainer}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity onPress={() => togglePicker('date')} style={styles.pickerTrigger}>
                        <Text>{new Date(currentDate).toDateString()}</Text>
                    </TouchableOpacity>
                    {showPickers.date && (
                        <DateTimePicker
                            value={new Date(currentDate)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                                if (selectedDate) handleDateChange(selectedDate);
                            }}
                        />
                    )}
                </View> */}
                {/* Date Picker */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        onPress={() => togglePicker('date')}
                        style={[
                            styles.dateButton,
                            isDateDisabled(new Date(currentDate)) && styles.disabledDate
                        ]}
                    >
                        <Text style={isDateDisabled(new Date(currentDate)) ? styles.disabledText : null}>
                            {new Date(currentDate).toDateString()}
                        </Text>
                    </TouchableOpacity>
                    {renderDatePicker()}
                </View>


                {/* Time In Dropdown */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Time In</Text>
                    <TouchableOpacity onPress={() => togglePicker('timeIn')} style={styles.pickerTrigger}>
                        <Text>{days[currentDate]?.timeIn || 'Select Time In'}</Text>
                    </TouchableOpacity>
                    {showPickers.timeIn && (
                        <Modal transparent={true} visible={showPickers.timeIn}>
                            <View style={styles.pickerModal}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={days[currentDate]?.timeIn || ''}
                                        onValueChange={(itemValue) => {
                                            if (itemValue) {
                                                handleDataChange('timeIn', itemValue);
                                                setShowPickers({ ...showPickers, timeIn: false });
                                            }
                                        }}
                                    >
                                        <Picker.Item label="Select Time" value="" />
                                        {TIME_SLOTS.map((time, index) => (
                                            <Picker.Item key={index} label={time} value={time} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </Modal>
                    )}
                </View>

                {/* Lunch Picker */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Lunch</Text>
                    <TouchableOpacity onPress={() => togglePicker('lunch')} style={styles.pickerTrigger}>
                        <Text>
                            {days[currentDate]?.lunch !== undefined && days[currentDate]?.lunch !== null
                                ? `${days[currentDate].lunch} min`
                                : 'Select Lunch Break'}
                        </Text>
                    </TouchableOpacity>
                    {showPickers.lunch && (
                        <Modal transparent={true} visible={showPickers.lunch}>
                            <View style={styles.pickerModal}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={days[currentDate]?.lunch !== undefined ? days[currentDate].lunch : null}
                                        onValueChange={(itemValue) => {
                                            handleDataChange('lunch', itemValue);
                                            setShowPickers({ ...showPickers, lunch: false });
                                        }}
                                    >
                                        <Picker.Item label="0 min" value={0} />
                                        <Picker.Item label="15 min" value={15} />
                                        <Picker.Item label="30 min" value={30} />
                                        <Picker.Item label="45 min" value={45} />
                                        <Picker.Item label="60 min" value={60} />
                                    </Picker>
                                </View>
                            </View>
                        </Modal>
                    )}
                </View>

                {/* Time Out Dropdown */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Time Out</Text>
                    <TouchableOpacity onPress={() => togglePicker('timeOut')} style={styles.pickerTrigger}>
                        <Text>{days[currentDate]?.timeOut || 'Select Time Out'}</Text>
                    </TouchableOpacity>
                    {showPickers.timeOut && (
                        <Modal transparent={true} visible={showPickers.timeOut}>
                            <View style={styles.pickerModal}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={days[currentDate]?.timeOut || ''}
                                        onValueChange={(itemValue) => {
                                            if (itemValue) {
                                                handleDataChange('timeOut', itemValue);
                                                setShowPickers({ ...showPickers, timeOut: false });
                                            }
                                        }}
                                    >
                                        <Picker.Item label="Select Time" value="" />
                                        {TIME_SLOTS.map((time, index) => (
                                            <Picker.Item key={index} label={time} value={time} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </Modal>
                    )}
                </View>

                {/* Total Hours */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Total Hours</Text>
                    <TextInput
                        keyboardType="numeric"
                        value={days[currentDate]?.totalHours?.toString() || ''}
                        onChangeText={(text) => handleDataChange('totalHours', Number(text))}
                        style={styles.input}
                    />
                </View>

                {/* Capture/Upload Timesheet (Weekend Only) */}

                <TouchableOpacity style={[styles.uploadButton, { marginTop: 20 }]} onPress={openCamera}>
                    <Text style={styles.buttonText}>Capture Timesheet</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20 }}>or</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Text style={styles.buttonText}>Upload Timesheet</Text>
                </TouchableOpacity>
                {image && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: image.uri }} style={styles.image} />
                        <TouchableOpacity
                            style={styles.removeIcon}
                            onPress={() => setImage(null)}
                        >
                            <Text style={styles.removeIconText}>×</Text>
                        </TouchableOpacity>
                    </View>
                )}


                {/* Save as Draft Button */}
                <Button
                    mode="contained"
                    onPress={saveAsDraft}
                    style={styles.draftButton}
                    loading={draftLoading}
                >
                    Save as Draft
                </Button>


                {/* Submit Button */}
                {/* {isWeekendSubmission && ( */}
                <>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={styles.submitButton}
                        loading={loading}
                    >
                        SUBMIT
                    </Button>
                </>
                {/* )} */}

                {/* Draft Data Table */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeaderContainer}>
                        <Text style={styles.tableTitle}>Your Draft Entries</Text>

                    </View>

                    {draftData.length > 0 ? (
                        <ScrollView horizontal={true} style={styles.horizontalScroll}>
                            <View>
                                {/* Table Header */}
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, styles.dateColumn]}>Date</Text>
                                    <Text style={styles.headerCell}>Time In</Text>
                                    <Text style={styles.headerCell}>Time Out</Text>
                                    <Text style={styles.headerCell}>Lunch</Text>
                                    <Text style={styles.headerCell}>Total Hours</Text>
                                </View>

                                {/* Table Rows */}
                                {draftData.map((item, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.tableRow,
                                            index % 2 === 0 ? styles.evenRow : styles.oddRow
                                        ]}
                                    >
                                        <Text style={[styles.cellText, styles.dateColumn]}>{item.date}</Text>
                                        <Text style={styles.cellText}>{item.time_in}</Text>
                                        <Text style={styles.cellText}>{item.time_out}</Text>
                                        <Text style={styles.cellText}>{item.lunch_timeout} min</Text>
                                        <Text style={styles.cellText}>{item.total_hours}</Text>
                                    </View>
                                ))}

                            </View>
                        </ScrollView>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No draft entries found</Text>
                        </View>
                    )}
                </View>
            </View>

        </ScrollView>
    );
};

// Reuse the same styles from previous code
const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f4f4',
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 40 : 70,
    },
    inputContainer: {
        width: '90%',
        padding: 10,
        borderRadius: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    pickerTrigger: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        width: 70,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    uploadButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 20,
        marginVertical: 5,
        width: '90%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 10,
        borderRadius: 10,
    },
    draftButton: {
        backgroundColor: 'orange',
        padding: 2,
        marginTop: 20,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
        marginBottom: 20
    },
    submitButton: {
        backgroundColor: 'green',
        padding: 2,
        marginTop: 20,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
    },
    pickerModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginTop: 10,
    },
    removeIcon: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'red',
        width: 25,
        height: 25,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeIconText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    tableContainer: {
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // elevation: 3,
    },
    tableHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    tableTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },


    // horizontalScroll: {
    //     maxHeight: 300, // Limits the table height
    // },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 10,
        minWidth: 500, // Minimum width to prevent squeezing
    },
    headerCell: {
        fontWeight: 'bold',
        paddingHorizontal: 8,
        minWidth: 80, // Minimum column width
        textAlign: 'center',
    },
    dateColumn: {
        minWidth: 100, // Wider column for dates
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minWidth: 500, // Matches header width
    },
    evenRow: {
        backgroundColor: '#f9f9f9',
    },
    oddRow: {
        backgroundColor: '#fff',
    },
    cellText: {
        paddingHorizontal: 8,
        minWidth: 80,
        textAlign: 'center',
        color: '#555',
    },
    noDataContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noDataText: {
        color: '#888',
        fontSize: 14,
    },
    disabledDayText: {
        color: '#ccc',
        textDecorationLine: 'line-through',
    },
    pickerModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
    },
    closeButton: {
        marginTop: 10,
    },
    dateButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    disabledDate: {
        backgroundColor: '#f5f5f5',
    },
    disabledText: {
        color: '#999',
    },

});

export default DashboardScreen;