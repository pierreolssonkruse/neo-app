import axios from 'axios';

const BASE_URL = 'https://api.nasa.gov/neo/rest/v1/feed';

export const fetchNEOs = async (startDate: string, endDate: string): Promise<any> => {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          start_date: startDate,
          end_date: endDate,
          api_key: process.env.NEXT_PUBLIC_NASA_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching NEOs:", error);
      return null;
    }
  };
