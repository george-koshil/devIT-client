import React, { useState } from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const [concurrency, setConcurrency] = useState<number>(10);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<number[]>([]);

  const handleStart = async () => {
    setIsRunning(true);
    setResults([]);
    const requestCount = 1000;
    const concurrencyLimit = concurrency;
    const requestsPerSecond = concurrency;

    const requestQueue: Promise<void>[] = [];

    const makeRequest = async (index: number) => {
      try {
        const response = await axios.post(process.env.REACT_APP_API_URL!, { index });
        setResults((prev) => [...prev, response.data.index]);
      } catch (error) {
        console.error(`Request ${index} failed:`, error);
      }
    };

    const processQueue = async () => {
      for (let i = 1; i <= requestCount; i++) {
        if (requestQueue.length >= concurrencyLimit) {
          await Promise.race(requestQueue);
        }

        const requestPromise = makeRequest(i).finally(() => {
          requestQueue.splice(requestQueue.indexOf(requestPromise), 1);
        });

        requestQueue.push(requestPromise);

        if (i % requestsPerSecond === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      await Promise.all(requestQueue);
      setIsRunning(false);
    };

    processQueue();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Client-Server Data Fetch</h2>
      <input
        type="number"
        value={concurrency}
        onChange={(e) => setConcurrency(Math.max(0, Math.min(100, Number(e.target.value))))}
        min="0"
        max="100"
        required
        disabled={isRunning}
      />
      <button onClick={handleStart} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Start'}
      </button>

      <ul>
        {results.map((result, index) => (
          <li key={index}>Request Index: {result}</li>
        ))}
      </ul>
    </div>
  );
};

export default App;
