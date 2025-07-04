// HeyGen Token Service - Creates session tokens from API keys
export class HeyGenTokenService {
  private static readonly API_ENDPOINT = 'https://api.heygen.com/v1/streaming.create_token';

  /**
   * Creates a session token from API key
   * According to HeyGen docs, the StreamingAvatar requires a session token, not the API key directly
   */
  static async createSessionToken(apiKey: string): Promise<string> {
    try {
      console.log('=== TOKEN SERVICE START ===');
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      console.log('API Endpoint:', this.API_ENDPOINT);
      
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          // Empty body as per HeyGen API documentation
        }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Response Body:', errorBody);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(`Token creation failed: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

      if (!data.data || !data.data.token) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response: missing token in response data');
      }

      const token = data.data.token;
      console.log('Token created successfully (first 10 chars):', token.substring(0, 10) + '...');
      console.log('=== TOKEN SERVICE COMPLETE ===');
      
      return token;
    } catch (error: any) {
      console.error('=== TOKEN SERVICE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to HeyGen API. Please check your internet connection.');
      }
      
      throw error;
    }
  }
} 