"use client"
import { useState } from 'react';
const DataGenerator = ({ onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [preprocessedSample, setPreprocessedSample] = useState(null);
  const [actualLabel, setActualLabel] = useState(null);
  const [modelCorrect, setModelCorrect] = useState(null);

  const buttonStyle = {
    margin: "10px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  };

  const handleGenerateData = async (type) => {
    setLoading(true);
    setPrediction(null);
    setPreprocessedSample(null);
    setActualLabel(null);
    setModelCorrect(null);

    try {
      // Send request to the backend to generate data sample and classify
      const response = await fetch('/predict', {  // Make sure the backend API is correct
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ button_type: type }),  // Send the button type (fraud/legit)
      });

      const result = await response.json();
      
      if (result.error) {
        console.error(result.error);
        return;
      }

      // Extract prediction and sample
      const { prediction: modelPrediction, sample } = result;
      setPrediction(modelPrediction);

      // Set actual label (fraud_label) and check if model's prediction matches the actual label
      const isFraud = sample.fraud_label === 1;
      setActualLabel(isFraud ? 'Fraud' : 'Legitimate');
      setModelCorrect(modelPrediction === sample.fraud_label);  // Check if model prediction matches

      // Preprocess sample and show corresponding features
      setPreprocessedSample(result.sample); // Display sample features after preprocessing
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleGenerateData("fraud")} style={buttonStyle} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Fraudulent Data'}
      </button>
      <button onClick={() => handleGenerateData("legit")} style={buttonStyle} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Legitimate Data'}
      </button>

      {loading && <div>Loading...</div>}

      {preprocessedSample && (
        <div style={{ marginTop: '20px' }}>
          <h3>Preprocessed Data Sample:</h3>
          <pre>{JSON.stringify(preprocessedSample, null, 2)}</pre>
        </div>
      )}

      {prediction !== null && (
        <div style={{ marginTop: '20px' }}>
          <h3>Model Prediction: {prediction === 1 ? 'Fraud' : 'Legitimate'}</h3>
          <h4>Actual Label: {actualLabel}</h4>
          <h4>Prediction Correct: {modelCorrect ? 'Yes' : 'No'}</h4>
        </div>
      )}
    </div>
  );
};

export default DataGenerator;