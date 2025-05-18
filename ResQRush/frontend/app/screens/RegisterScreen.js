import 'react-native-get-random-values'; // Polyfill for UUID
import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { db, auth } from "../firebase/firebaseConnection";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import doc and setDoc
import { v4 as uuidv4 } from "uuid";
import Modal from 'react-native-modal';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver"); // Default role
  // For hospital role
  const [hospitalId, setHospitalId] = useState(""); 
  const [contactNumber, setContactNumber] = useState("")
  const [zonalRegion, setZonalRegion] = useState(""); // For police role
  const [name,setName] = useState("");
  const [vehicleNumber,setVehicleNumber] = useState("");
  const [driverId, setDriverId] = useState(uuidv4()); // Generate a unique DRIVER_ID
  const [isModalVisible, setModalVisible] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !role) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    // Validate role-specific fields
    if (role === "hospital" && !hospitalId) {
      Alert.alert("Error", "Please enter Hospital ID.");
      return;
    }
    if (role === "police" && !zonalRegion) {
      Alert.alert("Error", "Please enter Zonal Region.");
      return;
    }
    if (role === "driver" && !name || !vehicleNumber) {
      Alert.alert("Error", "Please enter name and Vehicle number.");
      return;
    }
  
    try {
      console.log("Registering user:", email, password, role);
  
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User registered successfully:", user.uid);
  
      // Prepare user data for Firestore
      const userData = {
        uid: user.uid, // Store the Firebase Auth UID
        email: email.trim(),
        role: role.trim(),
        createdAt: new Date().toISOString(),
      };
  
      // Add role-specific fields
      if (role === "driver") {
        userData.driverId = user.uid; // Store DRIVER_ID for drivers
        userData.name = name;
        userData.vehicleNumber = vehicleNumber;
      } else if (role === "hospital") {
        // Extract numeric part of the hospital ID
        const numericHospitalId = hospitalId.replace(/\D/g, ""); // Remove non-numeric characters
        userData.hospitalId = numericHospitalId; // Store only the numeric part
      } else if (role === "police") {
        userData.zonalRegion = zonalRegion.trim(); // Store zonalRegion for police
      }
      // Note: No additional fields needed for 'user' role
  
      // Add user details to Firestore with the UID as the document ID
      const userRef = doc(db, "users", user.uid); // Use UID as the document ID
      await setDoc(userRef, userData); // Use setDoc instead of addDoc
      console.log("User details added to Firestore with UID as document ID");
  
      // If the user is a driver, create an entry in the ambulances collection
      if (role === "driver") {
        const ambulanceRef = doc(db, "ambulances", user.uid); // Use UID as the document ID
        await setDoc(ambulanceRef, {
          driverId: user.uid, // Store DRIVER_ID for drivers
          latitude: 0, // Default latitude
          longitude: 0, // Default longitude
          timestamp: new Date().toISOString(),
        });
        console.log("Ambulance details added to Firestore with UID as document ID");
      }
  
      // Show success pop-up
      setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate("Login");
        }, 5000);

    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Role Selection Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Select Role:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Driver" value="driver" />
            <Picker.Item label="Hospital" value="hospital" />
            <Picker.Item label="Police" value="police" />
            <Picker.Item label="User" value="user" />
          </Picker>
        </View>
      </View>

      <Modal isVisible={isModalVisible}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'green' }}>
            ✅ Success!
          </Text>
          <Text>User registered successfully.</Text>
        </View>
      </Modal>

      {/* Common Fields */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
          style={styles.input}
          placeholder="Contact Number"
          value={contactNumber}
          onChangeText={setContactNumber}
        />

      {/* Hospital Role Fields */}
      {role === "hospital" && (
        <TextInput
          style={styles.input}
          placeholder="Hospital ID"
          value={hospitalId}
          onChangeText={setHospitalId}
        />
      )}

      {/* User Role Fields */}
      {role === "user" && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      )}

      {/* User Role Fields */}
      {role === "driver" && (
        <>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Vehicle Number"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
        />
        </>
      )}

      {/* Police Role Fields */}
      {role === "police" && (
        <TextInput
          style={styles.input}
          placeholder="Zonal Region"
          value={zonalRegion}
          onChangeText={setZonalRegion}
        />
      )}

      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  dropdownContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#ef4444",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    color: "#ef4444",
    fontSize: 16,
  },
});

export default RegisterScreen;