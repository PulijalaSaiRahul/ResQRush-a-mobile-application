import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../firebase/firebaseConnection';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import fetchNearbyHospitals from '../services/fetchNearbyHospitals';

const HospitalSelectionScreen = ({ route, navigation }) => {
  const { incidentId, incidentDetails, driverLocation } = route.params || {};
  const [allHospitals, setAllHospitals] = useState([]);
  const [displayedHospitals, setDisplayedHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [hospitalResponse, setHospitalResponse] = useState(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [unsubscribeListener, setUnsubscribeListener] = useState(null);

  useEffect(() => {
    // Validate required parameters
    if (!incidentId || !incidentDetails || !driverLocation) {
      Alert.alert('Error', 'Missing required parameters');
      navigation.goBack();
      return;
    }

    // Clean up listener when component unmounts
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [unsubscribeListener]);

  const handleFetchHospitals = async () => {
    if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
      Alert.alert('Error', 'Unable to get current location.');
      return;
    }

    setLoading(true);
    try {
      const hospitalData = await fetchNearbyHospitals(
        driverLocation.latitude,
        driverLocation.longitude
      );

      // Sort hospitals by distance and remove duplicates
      const uniqueHospitals = hospitalData.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      const sortedHospitals = uniqueHospitals.sort(
        (a, b) => a.distanceFromDriver - b.distanceFromDriver
      );

      setAllHospitals(sortedHospitals);
      setDisplayedHospitals(sortedHospitals.slice(0, displayCount));
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      Alert.alert('Error', 'Failed to fetch nearby hospitals.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowMoreHospitals = () => {
    setFetchingMore(true);
    const nextDisplayCount = displayCount + 5;
    setDisplayCount(nextDisplayCount);
    setDisplayedHospitals(allHospitals.slice(0, nextDisplayCount));
    setFetchingMore(false);
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setShowConfirmation(true);
  };

  const confirmHospitalSelection = async () => {
    if (!selectedHospital || !incidentId) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setShowConfirmation(false);
    setShowWaiting(true);

    try {
      // Update the incident with the selected hospital
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, {
        'status.hospital': 'requested',
        hospitalInfo: {
          id: selectedHospital.id,
          name: selectedHospital.name,
          address: selectedHospital.address,
          latitude: selectedHospital.latitude,
          longitude: selectedHospital.longitude
        },
        hospitalRequestedAt: new Date().toISOString()
      });

      // Listen for hospital response
      const unsubscribe = onSnapshot(incidentRef, (doc) => {
        const data = doc.data();
        if (data?.status?.hospital === 'accepted') {
          setHospitalResponse('accepted');
          setShowWaiting(false);
          if (unsubscribe) unsubscribe();
          navigateToHospital();
        } else if (data?.status?.hospital === 'rejected') {
          setHospitalResponse('rejected');
          setShowWaiting(false);
          if (unsubscribe) unsubscribe();
          Alert.alert(
            'Hospital Rejected',
            `${selectedHospital.name} cannot take the patient now. Please select another hospital.`,
            [{ text: 'OK', onPress: () => setSelectedHospital(null) }]
          );
        }
      });

      setUnsubscribeListener(() => unsubscribe);

      // Set timeout in case no response comes
      setTimeout(() => {
        if (!hospitalResponse) {
          setShowWaiting(false);
          if (unsubscribe) unsubscribe();
          Alert.alert(
            'No Response',
            'The hospital did not respond in time. Please try another hospital.',
            [{ text: 'OK', onPress: () => setSelectedHospital(null) }]
          );
        }
      }, 30000); // 30 seconds timeout

    } catch (error) {
      console.error('Error updating incident:', error);
      Alert.alert('Error', 'Failed to send request to hospital');
      setShowWaiting(false);
      if (unsubscribeListener) unsubscribeListener();
    }
  };

  const navigateToHospital = () => {
    if (!driverLocation || !selectedHospital) {
      Alert.alert('Error', 'Missing required location data');
      return;
    }

    navigation.navigate('DriverNavigation', {
      driverLocation: driverLocation,
      destinationLocation: {
        latitude: selectedHospital.latitude,
        longitude: selectedHospital.longitude,
        address: selectedHospital.address,
        name: selectedHospital.name,
        type: 'hospital'
      },
      incidentId: incidentId,
      isHospitalNavigation: true,
      hospitalId: selectedHospital.id
    });
  };

  const handleCancelSelection = () => {
    setShowConfirmation(false);
    setSelectedHospital(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerText}>Select Hospital</Text>
      </LinearGradient>

      <View style={styles.incidentContainer}>
        <Text style={styles.incidentType}>{incidentDetails?.type || 'Incident'}</Text>
        <Text style={styles.description}>{incidentDetails?.description || 'No description'}</Text>
        <Text style={styles.address}>{incidentDetails?.address || 'No address'}</Text>
        {incidentDetails?.patientInfo && (
          <>
            <Text style={styles.patientInfo}>
              Patient: {incidentDetails.patientInfo.name || 'Not specified'}
            </Text>
            <Text style={styles.patientInfo}>
              Age: {incidentDetails.patientInfo.age || 'Not specified'}
            </Text>
            <Text style={styles.patientInfo}>
              Condition: {incidentDetails.patientInfo.condition || 'Not specified'}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.fetchButton}
        onPress={handleFetchHospitals}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.fetchButtonText}>Fetch Nearby Hospitals</Text>
        )}
      </TouchableOpacity>

      {displayedHospitals.length > 0 ? (
        <View style={styles.hospitalsContainer}>
          <Text style={styles.sectionTitle}>Nearby Hospitals:</Text>
          {displayedHospitals.map((hospital, index) => (
            <TouchableOpacity
              key={`${hospital.id}-${index}`}
              style={styles.hospitalCard}
              onPress={() => handleSelectHospital(hospital)}
            >
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              <Text style={styles.hospitalAddress}>{hospital.address}</Text>
              <Text style={styles.hospitalDistance}>
                {hospital.distanceFromDriver.toFixed(0)} meters away
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="local-hospital" size={50} color="#888" />
          <Text style={styles.noHospitalsText}>No hospitals found</Text>
          <Text style={styles.subText}>Press the button above to fetch nearby hospitals</Text>
        </View>
      )}

      {allHospitals.length > displayedHospitals.length && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={handleShowMoreHospitals}
          disabled={fetchingMore}
        >
          {fetchingMore ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.showMoreButtonText}>Show More Hospitals</Text>
          )}
        </TouchableOpacity>
      )}

      <Modal visible={showConfirmation} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Hospital</Text>
            <Text style={styles.modalText}>
              Are you sure you want to select {selectedHospital?.name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelSelection}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmHospitalSelection}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Confirming...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWaiting} transparent animationType="fade">
        <View style={styles.waitingContainer}>
          <View style={styles.waitingContent}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.waitingText}>Requesting hospital...</Text>
            <Text style={styles.waitingSubtext}>
              Waiting for response from {selectedHospital?.name || 'hospital'}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  incidentContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  address: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  patientInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  fetchButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fetchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hospitalsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  hospitalCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  hospitalDistance: {
    fontSize: 14,
    color: '#4285F4',
  },
  showMoreButton: {
    backgroundColor: '#FBBC05',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  showMoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  confirmButton: {
    backgroundColor: '#34A853',
  },
  cancelButton: {
    backgroundColor: '#EA4335',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  waitingContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  waitingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noHospitalsText: {
    fontSize: 18,
    color: '#555',
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
});

export default HospitalSelectionScreen;