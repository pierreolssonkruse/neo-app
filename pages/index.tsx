import { useEffect, useState } from 'react';
import { fetchNEOs } from '../lib/neows';
import NEOVisualizer from '../components/NEOVisualizer';

const HomePage = () => {
  const [neoData, setNeoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchNEOs('2023-09-12', '2023-09-12');
        setNeoData(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch NEO data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Near Earth Objects Visualization</h1>
      {neoData && <NEOVisualizer neoData={neoData} />}
    </div>
  );
};

export default HomePage;
