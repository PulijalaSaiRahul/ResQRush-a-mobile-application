import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Linking
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConnection";
import app from "../firebase/firebaseConnection";
import { getAuth, signOut } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

const PoliceScreen = () => {
  const [activeTab, setActiveTab] = useState("incidents");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [filterStatus, setFilterStatus] = useState(null); // null | 'busy' | 'available'
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDriverModalVisible, setDriverModalVisible] = useState(false);


  const navigation = useNavigation();
  const handleHospitalPress = (hospital) => {
    setSelectedHospital(hospital);
    setModalVisible(true);
  };

  const fetchAmbulances = async () => {
    try {
      const snapshot = await getDocs(collection(db, "ambulances"));
      const ambulanceList = [];
      snapshot.forEach((doc) => {
        ambulanceList.push({ id: doc.id, ...doc.data() });
      });
      setAmbulances(ambulanceList);
    } catch (error) {
      console.error("Error fetching ambulances:", error);
    }
  };
  const fetchHospitals = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'hospitals'));
      const hospitalList = []
      snapshot.forEach((doc) => {
        hospitalList.push({ id: doc.id, ...doc.data() });
      });
      setHospitals(hospitalList);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          "Error",
          "You are not logged in. Please log in to continue."
        );
        setLoading(false);
        return;
      }

      try {
        const incidentsRef = collection(db, "incidents");
        const incidentsQuery = query(incidentsRef);

        const unsubscribe = onSnapshot(incidentsQuery, (snapshot) => {
          const incidentList = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            incidentList.push({
              id: doc.id,
              ...data,
            });
          });
          setIncidents(incidentList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          <FontAwesome5 name="sign-out-alt" size={24} color={"#ffffff"} />
        </TouchableOpacity>
      ),
    });

    fetchData();
    fetchAmbulances();
    fetchHospitals();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      navigation.replace("Login");
      console.log("User logged out");
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  const assignToAllDrivers = async (incident) => {
    try {
      setLoading(true);

      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "driver")
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        Alert.alert("Error", "No drivers found");
        return;
      }

      const incidentRef = doc(db, "incidents", incident.id);
      await updateDoc(incidentRef, {
        "status.driver": "assigned",
        assignedAt: new Date().toISOString(),
        availableToAllDrivers: true,
      });

      const batch = [];
      usersSnapshot.forEach((userDoc) => {
        const notificationRef = doc(
          collection(db, "users", userDoc.id, "notifications")
        );
        batch.push(
          setDoc(notificationRef, {
            incidentId: incident.id,
            incidentType: incident.incidentType,
            address: incident.address,
            location: {
              latitude: incident.latitude,
              longitude: incident.longitude,
            },
            createdAt: new Date().toISOString(),
            status: "pending",
            read: false,
          })
        );
      });

      await Promise.all(batch);
      Alert.alert("Success", "Incident has been sent to all available drivers");
    } catch (error) {
      console.error("Error assigning to drivers:", error);
      Alert.alert("Error", "Failed to assign incident to drivers");
    } finally {
      setLoading(false);
    }
  };

  const filteredAmbulances = filterStatus
    ? ambulances.filter((a) => a.status === filterStatus)
    : ambulances;


  const handleResolveIncident = async (incidentId) => {
    try {
      setLoading(true);
      const incidentRef = doc(db, "incidents", incidentId);
      const incidentDoc = await getDoc(incidentRef);
      const incidentData = incidentDoc.data();

      await updateDoc(incidentRef, {
        "status.driver": "resolved",
        resolvedAt: new Date().toISOString(),
      });

      if (incidentData.assignedTo) {
        await updateDoc(doc(db, "ambulances", incidentData.assignedTo), {
          status: "available",
        });
      }

      setIncidents((prev) => prev.filter((inc) => inc.id !== incidentId));
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert("Error", "Failed to resolve incident");
    } finally {
      setLoading(false);
    }
  };

  const navigateToIncident = (incident) => {
    if (!incident.latitude || !incident.longitude) {
      Alert.alert("Error", "Invalid incident location data");
      return;
    }

    navigation.navigate("PoliceNavigation", {
      incidentId: incident.id,
      isIncident: true,
    });
  };

  const renderIncidentDetailsModal = () => (
  <Modal visible={showIncidentDetails} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>🚨 Incident Details</Text>

        {selectedIncident && (
          <>
            <Text style={styles.incidentTypeText}>
              🧾 {selectedIncident.incidentType || "Unknown Type"}
            </Text>
            <Text style={styles.detailsText}>📝 {selectedIncident.description || "No description"}</Text>
            <Text style={styles.detailsText}>📍 {selectedIncident.address || "No address"}</Text>

            {selectedIncident.assignedTo && (
              <>
                <Text style={styles.sectionTitle}>👨‍✈️ Assigned Driver</Text>
                <Text style={styles.detailsText}>👤 Name: {selectedIncident.driverInfo?.name || "N/A"}</Text>
                <Text style={styles.detailsText}>🚗 Vehicle: {selectedIncident.driverInfo?.vehicleNumber || "N/A"}</Text>
              </>
            )}

            <Text style={styles.sectionTitle}>🗺️ Locations</Text>
            <View style={styles.mapContainerSmall}>
              <MapView
                style={styles.mapSmall}
                initialRegion={{
                  latitude: selectedIncident.latitude,
                  longitude: selectedIncident.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: selectedIncident.latitude,
                    longitude: selectedIncident.longitude,
                  }}
                  title="Incident"
                  pinColor="red"
                />
                {selectedIncident.driverLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedIncident.driverLocation.latitude,
                      longitude: selectedIncident.driverLocation.longitude,
                    }}
                    title="Driver"
                    pinColor="blue"
                  />
                )}
                {selectedIncident.hospitalInfo && (
                  <Marker
                    coordinate={{
                      latitude: selectedIncident.hospitalInfo.latitude,
                      longitude: selectedIncident.hospitalInfo.longitude,
                    }}
                    title="Hospital"
                    pinColor="green"
                  />
                )}
              </MapView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowIncidentDetails(false)}
              >
                <Text style={styles.modalButtonText}>❌ Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalNavigateButton,
                  !selectedIncident.assignedTo && styles.disabledButton,
                ]}
                onPress={() => {
                  if (selectedIncident.assignedTo) {
                    setShowIncidentDetails(false);
                    navigateToIncident(selectedIncident);
                  }
                }}
                disabled={!selectedIncident.assignedTo}
              >
                <Text style={styles.modalButtonText}>📡 Live Status</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  </Modal>
);

  const renderIncidentsScreen = () => (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.sectionHeading}>Reported Incidents</Text>
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <View
              key={incident.id}
              style={[
                styles.incidentItem,
                incident.status.driver === "assigned" &&
                styles.assignedIncident,
                incident.status.driver === "accepted" &&
                styles.acceptedIncident,
                incident.status.driver === "completed" &&
                styles.completedIncident,
              ]}
            >
              <Text style={styles.details}>{incident.description}</Text>
              <Text style={styles.address}>{incident.address}</Text>

              {incident.assignedTo && (
                <Text style={styles.driverAssigned}>
                  Driver: {incident.driverInfo?.name || "Unknown"} (
                  {incident.driverInfo?.vehicleNumber || "Unknown"})
                </Text>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() => {
                    setSelectedIncident(incident);
                    setShowIncidentDetails(true);
                  }}
                >
                  <MaterialIcons name="info" size={18} color="white" />
                  <Text style={styles.actionButtonText}> Details</Text>
                </TouchableOpacity>

                {incident.status.driver === "pending" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => assignToAllDrivers(incident)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <MaterialIcons
                          name="directions-car"
                          size={18}
                          color="white"
                        />
                        <Text style={styles.actionButtonText}> Assign</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {incident.status.driver !== "completed" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleResolveIncident(incident.id)}
                  >
                    <MaterialIcons name="check" size={18} color="white" />
                    <Text style={styles.actionButtonText}> Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={50} color="#888" />
            <Text style={styles.noDataText}>No incidents found</Text>
          </View>
        )}
      </ScrollView>

      {renderIncidentDetailsModal()}
    </View>
  );

  const renderDashboardScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statItem, { backgroundColor: '#fbbc04' }]}
          onPress={() => setFilterStatus("busy")}
        >
          <Text style={styles.statNumber}>
            {ambulances.filter((i) => i.status === "busy").length}
          </Text>
          <Text style={styles.statLabel}>Busy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statItem, { backgroundColor: '#34a853' }]}
          onPress={() => setFilterStatus("available")}
        >
          <Text style={styles.statNumber}>
            {ambulances.filter((i) => i.status === "available").length}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </TouchableOpacity>
      </View>

      {filterStatus && (
        <TouchableOpacity onPress={() => setFilterStatus(null)} style={styles.clearFilterButton}>
          <Text style={styles.clearFilterText}>Clear Filter</Text>
        </TouchableOpacity>
      )}

      <View style={styles.ambulanceList}>
        {filteredAmbulances.length === 0 ? (
          <Text style={styles.noDataText}>
            No ambulances {filterStatus ? `with status "${filterStatus}"` : ""}
          </Text>
        ) : (
          filteredAmbulances.map((amb) => (
            <TouchableOpacity onPress={() => {
              setSelectedDriver(amb);
              setDriverModalVisible(true);
            }}>
              <View key={amb.id} style={styles.ambulanceCard}>
                <Text style={styles.ambulanceName}>🚑 {amb.name || "Unknown"}</Text>
                <View style={styles.ambulanceRow}>
                  <Text style={styles.ambulanceLabel}>🚗 Vehicle:</Text>
                  <Text style={styles.ambulanceValue}>{amb.vehicleNumber || "N/A"}</Text>
                </View>
                <View style={styles.ambulanceRow}>
                  <Text style={styles.ambulanceLabel}>📌 Status:</Text>
                  <Text style={styles.ambulanceValue}>{amb.status || "Unknown"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
      <Modal
        visible={isDriverModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDriverModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚑 {selectedDriver?.name || "Unknown"}</Text>
            <Text style={styles.modalText}>🚗 Vehicle: {selectedDriver?.vehicleNumber || "N/A"}</Text>
            <Text style={styles.modalText}>📌 Status: {selectedDriver?.status || "Unknown"}</Text>
            <Text style={styles.modalText}>📞 contactNumber: {selectedDriver?.contactNumber || "N/A"}</Text>
            {selectedDriver?.location && (
              <Text style={styles.modalText}>
                🌍 Location: {selectedDriver.location.latitude}, {selectedDriver.location.longitude}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.callButton} onPress={() => {
                const phoneNumber = selectedDriver?.contactNumber
                Linking.openURL(`tel:${phoneNumber}`);
              }}>
                <Text style={styles.buttonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDriverModalVisible(false)}>
                <Text style={styles.buttonText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );

  const renderHospitalScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: '#4285f4' }]}>
          <Text style={styles.statNumber}>{hospitals.length}</Text>
          <Text style={styles.statLabel}>Total Hospitals</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.noDataText}>Loading hospital data...</Text>
      ) : hospitals.length === 0 ? (
        <Text style={styles.noDataText}>No hospital data found</Text>
      ) : (
        <View style={styles.hospitalList}>
          {hospitals.map((hospital) => (
            <TouchableOpacity key={hospital.id} onPress={() => handleHospitalPress(hospital)}>
              <View style={styles.hospitalCard}>
                <Text style={styles.hospitalName}>🏥 {hospital.name || "Unknown"}</Text>
                <Text style={styles.hospitalInfo}>📍 {hospital.address || "N/A"}</Text>
                <Text style={styles.hospitalInfo}>
                  🌐 Lat: {hospital.latitude}, Lon: {hospital.longitude}
                </Text>
                <Text style={styles.hospitalDistance}>
                  🚗 Distance: {hospital.distanceFromDriver} meters
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedHospital?.name}</Text>
            <Text style={styles.modalText}>📍 {selectedHospital?.address}</Text>
            <Text style={styles.modalText}>
              🌐 Lat: {selectedHospital?.latitude}, Lon: {selectedHospital?.longitude}
            </Text>
            <Text style={styles.modalText}>
              🚗 Distance: {selectedHospital?.distanceFromDriver} meters
            </Text>
            <Text style={styles.modalText}>📞 contactNumber: {selectedHospital?.contactNumber || "N/A"}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.callButton} onPress={() => {
                const phoneNumber = selectedHospital?.contactNumber
                Linking.openURL(`tel:${phoneNumber}`);
              }}>
                <Text style={styles.buttonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {activeTab === "incidents"
        ? renderIncidentsScreen()
        : activeTab === "ambulance"
          ? renderDashboardScreen()
          : renderHospitalScreen()}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("incidents")}
        >
          <MaterialIcons
            name="warning"
            size={24}
            color={activeTab === "incidents" ? "#FF0000" : "#888"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "incidents" && styles.activeTabText,
            ]}
          >
            Incidents
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("ambulance")}
        >
          <FontAwesome5
            name="shield-alt"
            size={20}
            color={activeTab === "ambulance" ? "#FF0000" : "#888"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "ambulance" && styles.activeTabText,
            ]}
          >
            Ambulances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("hospital")}
        >
          <FontAwesome5
            name="shield-alt"
            size={20}
            color={activeTab === "hospital" ? "#FF0000" : "#888"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "hospital" && styles.activeTabText,
            ]}
          >
            Hospitals
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  screenContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginBottom: 70,
  },
  incidentItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: "#4285F4",
  },
  acceptedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: "#34A853",
  },
  completedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: "#FBBC05",
  },
  details: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  address: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginVertical: 5,
  },
  driverAssigned: {
    fontSize: 13,
    color: "#4285F4",
    fontStyle: "italic",
    marginVertical: 5,
  },
  noDataText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  detailsButton: {
    backgroundColor: "#4285F4",
  },
  assignButton: {
    backgroundColor: "#34A853",
  },
  resolveButton: {
    backgroundColor: "#EA4335",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  tabBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    height: 70,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabButtonText: {
    fontSize: 12,
    marginTop: 5,
    color: "#888",
  },
  activeTabText: {
    color: "#FF0000",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#FF0000",
  },
  incidentType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  mapContainerSmall: {
    height: 200,
    marginVertical: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  mapSmall: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#EA4335",
  },
  modalNavigateButton: {
    backgroundColor: "#4285F4",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "white",
    margin: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF0000",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutButton: {
    padding: 6,
  },
  disabledButton: {
    backgroundColor: "#cccccc", // Greyed out
    opacity: 0.6,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginLeft: 15,
  },
  container: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  clearFilterButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  ambulanceList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  ambulanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  ambulanceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a73e8',
  },

  ambulanceRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  ambulanceLabel: {
    fontWeight: '600',
    marginRight: 5,
    color: '#333',
  },

  ambulanceValue: {
    color: '#555',
  },

  noDataText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
  ambulanceDetail: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  hospitalList: {
    marginTop: 10,
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  hospitalInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  hospitalDistance: {
    fontSize: 14,
    color: '#1a73e8',
    marginTop: 6,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#34a853',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,  // space between buttons
    alignItems: 'center',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#d93025',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,  // space between buttons
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

modalCard: {
  width: '85%',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  elevation: 5,
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

modalContent: {
  width: '90%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},

modalTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#d93025',
  marginBottom: 12,
  textAlign: 'center',
},

incidentTypeText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#202124',
  marginBottom: 6,
},

detailsText: {
  fontSize: 16,
  color: '#3c4043',
  marginVertical: 2,
},

sectionTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#1a73e8',
  marginTop: 12,
  marginBottom: 4,
},

mapContainerSmall: {
  height: 180,
  borderRadius: 10,
  overflow: 'hidden',
  marginTop: 10,
},

mapSmall: {
  flex: 1,
},

modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
},

modalButton: {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginHorizontal: 5,
},

modalCancelButton: {
  backgroundColor: '#d93025',
},

modalNavigateButton: {
  backgroundColor: '#34a853',
},

disabledButton: {
  backgroundColor: '#c4c4c4',
},

modalButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},

});

export default PoliceScreen;
