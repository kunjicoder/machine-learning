"use client"
import { useState } from "react";
import axios from "axios";
import DataGenerator from './components/DataGenerator';

export default function Home() {
  const [result, setResult] = useState("");
  const [sampleData, setSampleData] = useState(null);

  const handleGenerate = async (type) => {
    try {
      const response = await axios.post("http://localhost:5000/predict", { button_type: type });
      const { prediction, sample } = response.data;
      setResult(`Prediction: ${prediction === 1 ? "Fraudulent" : "Legitimate"}`);
      setSampleData(sample);
    } catch (error) {
      console.error("Error in request:", error);
      setResult("Error occurred during classification.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Credit Card Fraud Detection</h1>
      <DataGenerator onGenerate={handleGenerate} />
     
      {result && <p style={{ marginTop: "20px" }}>{result}</p>}
     
      {sampleData && (
        <div style={{ marginTop: "20px" }}>
          <h3>Sample Data:</h3>
          <pre>{JSON.stringify(sampleData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}