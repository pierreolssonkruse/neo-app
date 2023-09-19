import { useEffect, useState } from 'react';
import { fetchNEOs } from '../lib/neows';
import NEOVisualizer from '../components/NEOVisualizer';

const HomePage = () => {
  const today = new Date().toISOString().split('T')[0];
  const [neoData, setNeoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate]);

  const fetchDataForDate = async (date: string) => {
    try {
      setLoading(true);
      const data = await fetchNEOs(date, date);
      if (data && data.near_earth_objects) {
        setNeoData(data);
        setError(null);
      } else {
        setError("Invalid data format received.");
      }
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch NEO data.");
      setLoading(false);
    }
  };

  const handleDateChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    fetchDataForDate(newDate);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Near Earth Objects Visualization</h1>
      <input type="date" onChange={handleDateChange} value={selectedDate} />
      {neoData && <NEOVisualizer neoData={neoData} />}
    </div>
  );
}; 

export default HomePage;
