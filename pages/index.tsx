import { useEffect, useState } from 'react';
import { fetchNEOs } from '../lib/neows';
import NEOVisualizer from '../components/NEOVisualizer';

const HomePage = () => {
  const [neoData, setNeoData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchNEOs('2023-09-12', '2023-09-12');
      setNeoData(data);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Near Earth Objects Visualization</h1>
      {neoData && <NEOVisualizer neoData={neoData} />}
    </div>
  );
};

export default HomePage;