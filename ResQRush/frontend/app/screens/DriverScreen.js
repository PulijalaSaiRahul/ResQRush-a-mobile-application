import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { db, auth } from '../firebase/firebaseConnection';
import app from "../firebase/firebaseConnection";
import { getAuth, signOut } from "firebase/auth";
import { doc, updateDoc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';

const DriverScreen = ({ navigation }) => {
  const [assignedIncident, setAssignedIncident] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [driverData, setDriverData] = useState({
    name: '',
    vehicleNumber: '',
    contact: '',
    email: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Driver not authenticated');
      navigation.navigate('Login');
      return;
    }

    let interval = null;
    let unsubscribe = null;
    let acceptedUnsubscribe = null;

    const fetchAndStoreLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Allow location access to use this feature.');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const ambulanceDoc = await getDoc(doc(db, 'ambulances', user.uid));
        const { latitude, longitude } = location.coords;

        if (userDoc.exists() && ambulanceDoc.exists()) {
          const userData = userDoc.data();
          const ambulanceData = ambulanceDoc.data();

          setDriverData({
            name: userData.name || 'Driver',
            vehicleNumber: ambulanceData.vehicleNumber || 'Unknown',
            contact: ambulanceData.contact || 'N/A',
            email: userData.email
          });
        } else {
          Alert.alert('Error', 'Driver profile not complete');
        }

        const driverRef = doc(db, 'ambulances', auth.currentUser.uid);
        await updateDoc(driverRef, {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });

        setDriverLocation({
          latitude,
          longitude,
          driverId: auth.currentUser.uid,
        });
      } catch (error) {
        console.error('Location update error:', error);
      }
    };

    interval = setInterval(fetchAndStoreLocation, 20000);
    fetchAndStoreLocation(); // Initial fetch

    const fetchAssignedIncidents = () => {
      const incidentsRef = collection(db, 'incidents');

      const q = query(
        incidentsRef,
        where('status.driver', '==', 'assigned'),
        where('availableToAllDrivers', '==', true)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const incidentDoc = snapshot.docs[0];
          const incidentData = incidentDoc.data();
          setAssignedIncident({
            id: incidentDoc.id,
            ...incidentData
          });
        } else {
          setAssignedIncident(null);
        }
        setLoading(false);
      });

      const acceptedQuery = query(
        incidentsRef,
        where('assignedTo', '==', user.uid),
        where('status.driver', '==', 'accepted')
      );

      acceptedUnsubscribe = onSnapshot(acceptedQuery, (acceptedSnapshot) => {
        if (!acceptedSnapshot.empty) {
          const incidentDoc = acceptedSnapshot.docs[0];
          const incidentData = incidentDoc.data();
          setAssignedIncident({
            id: incidentDoc.id,
            ...incidentData
          });
          setShowNavigation(true);
        }
      });
    };

    fetchAssignedIncidents();

    // Cleanup on unmount or dependency change
    return () => {
      if (interval) clearInterval(interval);
      if (unsubscribe) unsubscribe();
      if (acceptedUnsubscribe) acceptedUnsubscribe();
    };
  }, [navigation]);

  // Move handleLogout outside useEffect:
  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      // Clean up interval and listeners before logging out
      // (optional if component unmounts on navigation)
      // You can also add explicit cleanup here if you lift refs outside useEffect

      await signOut(auth);
      navigation.replace("Login");
      console.log("User logged out");
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  // Set headerRight button outside useEffect or inside useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          <FontAwesome5 name="sign-out-alt" size={24} color={"#ffffff"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);


  const handleAcceptIncident = async () => {
    if (!auth.currentUser?.uid || !driverData.name) {
      Alert.alert('Error', 'Driver information incomplete');
      return;
    }

    try {
      setLoading(true);

      const driverInfo = {
        name: driverData.name,
        vehicleNumber: driverData.vehicleNumber,
        contact: driverData.contact,
        email: driverData.email
      };

      const incidentRef = doc(db, 'incidents', assignedIncident.id);
      await updateDoc(incidentRef, {
        'status.driver': 'accepted',
        assignedTo: auth.currentUser.uid,
        acceptedAt: new Date().toISOString(),
        driverInfo: driverInfo,
        availableToAllDrivers: false
      });

      await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
        status: 'busy',
        lastUpdated: new Date().toISOString()
      });

      setShowAcceptModal(false);
      setShowNavigation(true);
    } catch (error) {
      console.error('Error accepting incident:', error);
      Alert.alert('Error', 'Failed to accept incident');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNavigation = () => {
    if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
      Alert.alert('Error', 'Driver location data not available');
      return;
    }

    if (!assignedIncident || !assignedIncident.latitude || !assignedIncident.longitude) {
      Alert.alert('Error', 'Incident location data not available');
      return;
    }

    navigation.navigate('DriverNavigation', {
      driverLocation: {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        driverId: driverLocation.driverId
      },
      destinationLocation: {
        latitude: assignedIncident.latitude,
        longitude: assignedIncident.longitude,
        address: assignedIncident.address,
        type: 'incident'
      },
      incidentType: assignedIncident.incidentType,
      incidentId: assignedIncident.id,
      isHospitalNavigation: false
    });
  };

  const handleCompleteIncident = async () => {
    try {
      setLoading(true);

      const incidentRef = doc(db, 'incidents', assignedIncident.id);
      await updateDoc(incidentRef, {
        'status.driver': 'completed',
        completedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
        status: 'available',
        lastUpdated: new Date().toISOString()
      });

      // Navigate to the HospitalSelectionScreen with incident details
      navigation.navigate('HospitalSelection', {
        incidentId: assignedIncident.id,
        incidentDetails: {
          type: assignedIncident.incidentType,
          description: assignedIncident.description,
          address: assignedIncident.address,
          patientInfo: assignedIncident.patientInfo || {}
        },
        driverLocation: {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          driverId: driverLocation.driverId
        }
      });

      setAssignedIncident(null);
      setShowNavigation(false);
    } catch (error) {
      console.error('Error completing incident:', error);
      Alert.alert('Error', 'Failed to complete incident');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>

      {!assignedIncident ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="assignment" size={60} color="#bbb" />
          <Text style={styles.noDataText}>No assigned incidents</Text>
          <Text style={styles.subText}>Waiting for new assignments...</Text>
        </View>
      ) : !showNavigation ? (
        <>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDetailsModal(true)}
          >
            <View style={styles.incidentContainer}>
              <Text style={styles.incidentType}>{assignedIncident.incidentType}</Text>
              <Text style={styles.description}>{assignedIncident.description}</Text>
              <Text style={styles.address}>{assignedIncident.address}</Text>
              <Text style={styles.time}>
                Reported: {new Date(assignedIncident.createdAt).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
          <Modal
            visible={showDetailsModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDetailsModal(false)}
          >
            <View style={styles.detailsModalOverlay}>
              <View style={styles.detailsModalContent}>
                <Text style={styles.detailsModalTitle}>🚨 Incident Details</Text>

                {assignedIncident && (
                  <>
                    <Text style={styles.detailsModalText}>
                      🧾 {assignedIncident.incidentType || "Unknown Type"}
                    </Text>

                    <Text style={styles.detailsModalText}>
                      📝 {assignedIncident.description || "No description"}
                    </Text>

                    <Text style={styles.detailsModalText}>
                      📍 {assignedIncident.address || "No address"}
                    </Text>

                    <Text style={styles.detailsModalText}>
                      🕒 Reported At: {new Date(assignedIncident.createdAt).toLocaleString()}
                    </Text>

                    <View style={styles.detailsModalButtons}>
                      <TouchableOpacity
                        style={[styles.detailsModalButton, styles.detailsModalCancelButton]}
                        onPress={() => setShowDetailsModal(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailsModalButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>


          {driverLocation && assignedIncident.latitude && assignedIncident.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                  latitudeDelta: 0.06,
                  longitudeDelta: 0.03,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                  }}
                  title="Your Location"
                  pinColor="blue"
                />
                <Marker
                  coordinate={{
                    latitude: assignedIncident.latitude,
                    longitude: assignedIncident.longitude,
                  }}
                  title="Incident Location"
                  pinColor="red"
                />
              </MapView>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, loading ? styles.disabledButton : styles.acceptButton]}
              onPress={() => setShowAcceptModal(true)}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Accept Incident</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.navigationContainer}>
            <Text style={styles.navigationTitle}>Active Incident</Text>
            <Text style={styles.navigationText}>{assignedIncident.incidentType}</Text>
            <Text style={styles.address}>{assignedIncident.address}</Text>

            {driverLocation && assignedIncident.latitude && assignedIncident.longitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    latitudeDelta: 0.06,
                    longitudeDelta: 0.03,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude,
                    }}
                    title="Your Location"
                    pinColor="blue"
                  />
                  <Marker
                    coordinate={{
                      latitude: assignedIncident.latitude,
                      longitude: assignedIncident.longitude,
                    }}
                    title="Incident Location"
                    pinColor="red"
                  />
                </MapView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.navigateButton]}
              onPress={handleStartNavigation}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Navigate to Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleCompleteIncident}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={showAcceptModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Acceptance</Text>
            <Text style={styles.modalText}>
              Are you sure you want to accept this incident?
            </Text>
            {assignedIncident && (
              <>
                <Text style={styles.modalIncidentType}>{assignedIncident.incidentType}</Text>
                <Text style={styles.modalAddress}>{assignedIncident.address}</Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAcceptModal(false)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, loading ? styles.disabledModalButton : styles.modalAcceptButton]}
                onPress={handleAcceptIncident}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Accepting...' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>

  )
  
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f7fa',
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  noDataText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
  },
  subText: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },

  incidentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  incidentType: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    color: '#222',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    lineHeight: 22,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },

  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  map: {
    flex: 1,
  },

  buttonContainer: {
    marginTop: 10,
    alignItems: 'center',
  },

  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  navigateButton: {
    backgroundColor: '#007bff',
    marginBottom: 10,
  },
  completeButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#a3a3a3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  navigationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  navigationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
    color: '#222',
  },
  navigationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  modalIncidentType: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    color: '#222',
  },
  modalAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#bbb',
  },
  modalAcceptButton: {
    backgroundColor: '#28a745',
  },
  disabledModalButton: {
    backgroundColor: '#a3a3a3',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  detailsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#e74c3c',
  },
  detailsModalText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
    lineHeight: 22,
  },
  detailsModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  detailsModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  detailsModalCancelButton: {
    backgroundColor: '#e74c3c',
  },
  detailsModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },



});

export default DriverScreen;