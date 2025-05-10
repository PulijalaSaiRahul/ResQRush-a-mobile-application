// import { db } from '../firebase/firebaseConnection';
// import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
// import getAccessToken from './getAccessToken';

// // Function to calculate distance between two coordinates (Haversine formula)
// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   if (!lat1 || !lon1 || !lat2 || !lon2) return null;
//   const toRad = (value) => (value * Math.PI) / 180;
//   const R = 6371;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fetch new hospitals from Ola Maps API
// const fetchNewHospitals = async (latitude, longitude, offset = 0, limit = 5) => {
//   const accessToken = await getAccessToken();
//   if (!accessToken) {
//     console.error('Missing access token!');
//     return [];
//   }

//   try {
//     // Construct the API URL
//     const url = `https://api.olamaps.io/places/v1/nearbysearch?layers=venue&types=hospital&location=${latitude},${longitude}`;

//     // Make the API request
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'X-Request-Id': 'XXX', // Required header
//         'Content-Type': 'application/json',
//       },
//     });

//     // Check if the response is OK
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('API Error:', errorData);
//       throw new Error(`API Error: ${errorData.message || 'Unknown error'}`);
//     }

//     const data = await response.json();
//     console.log('API Response:', data); // Log the API response

//     // Check if the response contains valid data
//     if (!data.predictions || data.predictions.length === 0) {
//       console.error('No hospitals found.');
//       return [];
//     }

//     // Process the API response and store hospitals in Firestore
//     const hospitalData = await Promise.all(
//       data.predictions.map(async (prediction, index) => {
//         const hospitalEntry = {
//           id: prediction.place_id || `hospital-${Date.now()}-${index}`,
//           name: prediction.description || 'Unknown Hospital',
//           address: prediction.description || 'No Address Provided',
//           distanceFromDriver: prediction.distance_meters || 0, // Distance in meters
//           fetchOffset: offset, // Store the offset to track pagination
//         };

//         // Store in Firestore with offset information
//         await setDoc(doc(db, 'hospitals', hospitalEntry.id), hospitalEntry);
//         return hospitalEntry;
//       })
//     );

//     return hospitalData;
//   } catch (error) {
//     console.error('Error fetching hospitals:', error);
//     return [];
//   }
// };

// // Get hospitals from Firestore with pagination
// const getHospitalsFromFirestore = async (offset = 0, limit = 5) => {
//   try {
//     const hospitalsRef = collection(db, 'hospitals');
//     const querySnapshot = await getDocs(hospitalsRef);

//     if (!querySnapshot.empty) {
//       const allHospitals = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       // Sort by distance and apply pagination
//       const sortedHospitals = allHospitals.sort((a, b) =>
//         (a.distanceFromDriver || 0) - (b.distanceFromDriver || 0)
//       );

//       return sortedHospitals.slice(offset, offset + limit);
//     }
//     return [];
//   } catch (error) {
//     console.error('Error fetching hospitals from Firestore:', error);
//     return [];
//   }
// };

// // Main function with pagination support
// const fetchNearbyHospitals = async (latitude, longitude, offset = 0) => {
//   const limit = 5; // Number of hospitals per page

//   console.log(`Fetching new hospitals from API with offset ${offset}...`);
//   const apiHospitals = await fetchNewHospitals(latitude, longitude, offset, limit);

//   if (apiHospitals.length === 0) {
//     console.log('No hospitals found in API response. Falling back to Firestore data.');
//     return await getHospitalsFromFirestore(offset, limit);
//   }

//   return apiHospitals;
// };

// export default fetchNearbyHospitals;

// import { db } from '../firebase/firebaseConnection';
// import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
// import getAccessToken from './getAccessToken';
// import { v4 as uuidv4 } from 'uuid';

// // Function to extract numeric part of the hospital ID
// const extractNumericId = (placeId) => {
//   // Remove non-numeric characters
//   return placeId.replace(/\D/g, '');
// };

// // Function to calculate distance between two coordinates (Haversine formula)
// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   if (!lat1 || !lon1 || !lat2 || !lon2) return null;
//   const toRad = (value) => (value * Math.PI) / 180;
//   const R = 6371; // Radius of Earth in km
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// };

// // Fetch stored hospitals from Firestore
// const getHospitalsFromFirestore = async () => {
//   try {
//     const hospitalsRef = collection(db, 'hospitals');
//     const querySnapshot = await getDocs(hospitalsRef);

//     if (!querySnapshot.empty) {
//       return querySnapshot.docs.map((doc) => {
//         const hospital = doc.data();
//         return {
//           id: doc.id,
//           ...hospital,
//         };
//       });
//     } else {
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching hospitals from Firestore:', error);
//     return [];
//   }
// };

// // Fetch hospital details using Place Details API
// const fetchHospitalDetails = async (placeId, accessToken) => {
//   try {
//     const url = `https://api.olamaps.io/places/v1/details?place_id=${placeId}`;
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'X-Request-Id': uuidv4(),
//         'X-Correlation-Id': uuidv4(),
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`API Error: ${response.status}`);
//     }

//     const data = await response.json();
//     if (data.result && data.result.geometry && data.result.geometry.location) {
//       const { lat, lng } = data.result.geometry.location;
//       return { latitude: lat, longitude: lng };
//     } else {
//       throw new Error('Invalid hospital details response');
//     }
//   } catch (error) {
//     console.error('Error fetching hospital details:', error);
//     return null;
//   }
// };

// // Fetch new hospitals from API and store in Firestore
// const fetchNewHospitals = async (latitude, longitude, offset = 0, limit = 5, fetchedHospitalIds = new Set()) => {
//   const accessToken = await getAccessToken();
//   if (!accessToken) {
//     console.error('Missing OAuth token!');
//     return [];
//   }

//   try {
//     const url = `https://api.olamaps.io/places/v1/nearbysearch?layers=venue&types=hospital&location=${latitude},${longitude}&radius=5000`;
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'X-Request-Id': uuidv4(),
//         'X-Correlation-Id': uuidv4(),
//       },
//     });

//     const data = await response.json();
//     console.log('API Response:', data);

//     if (!data.predictions || data.predictions.length === 0) {
//       console.error('No hospitals found.');
//       return [];
//     }

//     // Process the API response and store hospitals in Firestore
//     const hospitalData = await Promise.all(
//       data.predictions.map(async (prediction, index) => {
//         if (fetchedHospitalIds.has(prediction.place_id)) {
//           return null;
//         }

//         fetchedHospitalIds.add(prediction.place_id);

//         // Fetch hospital details using Place Details API
//         const hospitalLocation = await fetchHospitalDetails(prediction.place_id, accessToken);
//         if (!hospitalLocation) {
//           return null;
//         }

//         // Extract numeric part of the hospital ID
//         const numericHospitalId = extractNumericId(prediction.place_id);

//         const hospitalEntry = {
//           id: numericHospitalId, // Store only the numeric part
//           name: prediction.description.split(',')[0].trim(),
//           address: prediction.description || 'No Address Provided',
//           latitude: hospitalLocation.latitude,
//           longitude: hospitalLocation.longitude,
//           distanceFromDriver: prediction.distance_meters || 0,
//           fetchOffset: offset,
//         };

//         // Store in Firestore
//         await setDoc(doc(db, 'hospitals', hospitalEntry.id), hospitalEntry);
//         return hospitalEntry;
//       })
//     );

//     // Filter out null values (duplicate hospitals)
//     const newHospitals = hospitalData.filter((hospital) => hospital !== null);
//     return newHospitals;
//   } catch (error) {
//     console.error('Error fetching hospitals:', error);
//     return [];
//   }
// };

// // Main function to fetch hospitals with Firestore caching
// const fetchNearbyHospitals = async (latitude, longitude, offset = 0, limit = 5, fetchedHospitalIds = new Set()) => {
//   console.log(`Fetching new hospitals from API with offset ${offset} and limit ${limit}...`);
//   const apiHospitals = await fetchNewHospitals(latitude, longitude, offset, limit, fetchedHospitalIds);

//   // If no hospitals are found after API calls, fall back to Firestore data
//   if (apiHospitals.length === 0) {
//     console.log('No hospitals found in API response. Falling back to Firestore data.');
//     return await getHospitalsFromFirestore();
//   }

//   return apiHospitals;
// };

// export default fetchNearbyHospitals;

import { db } from '../firebase/firebaseConnection';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import getAccessToken from './getAccessToken';
import { v4 as uuidv4 } from 'uuid';

// Function to extract numeric part of the hospital ID
const extractNumericId = (placeId) => {
  return placeId.replace(/\D/g, '');
};

// Fetch stored hospitals from Firestore
const getHospitalsFromFirestore = async () => {
  try {
    const hospitalsRef = collection(db, 'hospitals');
    const querySnapshot = await getDocs(hospitalsRef);

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map((doc) => {
        const hospital = doc.data();
        return {
          id: doc.id,
          ...hospital,
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching hospitals from Firestore:', error);
    return [];
  }
};

// Fetch hospital details using Place Details API
const fetchHospitalDetails = async (placeId, accessToken) => {
  try {
    const url = `https://api.olamaps.io/places/v1/details?place_id=${placeId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Request-Id': uuidv4(),
        'X-Correlation-Id': uuidv4(),
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.result && data.result.geometry && data.result.geometry.location) {
      const { lat, lng } = data.result.geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error('Invalid hospital details response');
    }
  } catch (error) {
    console.error('Error fetching hospital details:', error);
    return null;
  }
};

// Fetch new hospitals from API and store in Firestore
const fetchNewHospitals = async (latitude, longitude) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('Missing OAuth token!');
    return [];
  }

  try {
    const url = `https://api.olamaps.io/places/v1/nearbysearch?layers=venue&types=hospital&location=${latitude},${longitude}&radius=5000&rankBy=popular&limit=15`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Request-Id': uuidv4(),
        'X-Correlation-Id': uuidv4(),
      },
    });

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.predictions || data.predictions.length === 0) {
      console.error('No hospitals found.');
      return [];
    }

    // Filter out non-hospital results (e.g., cafes)
    const hospitalPredictions = data.predictions.filter(
      (prediction) => prediction.types.includes('hospital')
    );

    if (hospitalPredictions.length === 0) {
      console.error('No hospitals found in the API response.');
      return [];
    }

    // Process the API response and store hospitals in Firestore
    const hospitalData = await Promise.all(
      hospitalPredictions.map(async (prediction, index) => {
        // Fetch hospital details using Place Details API
        const hospitalLocation = await fetchHospitalDetails(prediction.place_id, accessToken);
        if (!hospitalLocation) {
          return null;
        }

        // Extract numeric part of the hospital ID
        const numericHospitalId = extractNumericId(prediction.place_id);

        const hospitalEntry = {
          id: numericHospitalId, // Store only the numeric part
          name: prediction.description.split(',')[0].trim(),
          address: prediction.description || 'No Address Provided',
          latitude: hospitalLocation.latitude,
          longitude: hospitalLocation.longitude,
          distanceFromDriver: prediction.distance_meters || 0,
        };

        // Store in Firestore
        await setDoc(doc(db, 'hospitals', hospitalEntry.id), hospitalEntry);
        return hospitalEntry;
      })
    );

    // Filter out null values (invalid hospitals)
    const newHospitals = hospitalData.filter((hospital) => hospital !== null);
    return newHospitals;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
};

// Main function to fetch hospitals with Firestore caching
const fetchNearbyHospitals = async (latitude, longitude) => {
  console.log(`Fetching new hospitals from API...`);
  const apiHospitals = await fetchNewHospitals(latitude, longitude);

  // If no hospitals are found after API calls, fall back to Firestore data
  if (apiHospitals.length === 0) {
    console.log('No hospitals found in API response. Falling back to Firestore data.');
    return await getHospitalsFromFirestore();
  }

  return apiHospitals;
};

export default fetchNearbyHospitals;