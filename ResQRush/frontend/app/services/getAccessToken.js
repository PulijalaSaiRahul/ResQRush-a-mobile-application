const getAccessToken = async () => {
  try {
    const clientId = '7d4920ee-cb87-4fb9-96c7-ba71d9b77c1e'; // Replace with your Ola Maps client ID
    const clientSecret = '76nnC1iectcewR24QDRHzTLLxjucOq1D'; // Replace with your Ola Maps client secret

    const response = await fetch(
      'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(
          clientId
        )}&client_secret=${encodeURIComponent(clientSecret)}`,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OAuth Error: ${data.error_description || 'Unknown error'}`);
    }

    console.log('OAuth Token:', data.access_token);
    return data.access_token; // Return access token for API calls
  } catch (error) {
    console.error('Error fetching OAuth token:', error);
    return null;
  }
};

export default getAccessToken;