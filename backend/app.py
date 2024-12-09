import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from sklearn.preprocessing import OrdinalEncoder
from datetime import datetime

app = Flask(__name__)

# Load the pre-saved model and encoder
model = joblib.load('backend/model.joblib')

# Load the dataset
dataset = pd.read_csv('backend/fraudTrain.csv')

# Separate fraud and legitimate data
fraud_data = dataset[dataset['fraud_label'] == 1]
legitimate_data = dataset[dataset['fraud_label'] == 0]

# Define the features to be used for the model
features = ['transaction_time', 'credit_card_number', 'amount(usd)', 'transaction_id', 
            'category', 'merchant', 'job', 'hour_of_day']



# This function preprocesses the incoming sample
def preprocess_sample(sample):
    # Step 1: Rename columns to match the training data format
    sample = sample.rename(columns={
        "trans_date_trans_time": "transaction_time",
        "cc_num": "credit_card_number",
        "amt": "amount(usd)",
        "trans_num": "transaction_id"
    })

    # Step 2: Apply UTC conversion for 'unix_time' and drop the column
    sample['time'] = sample['unix_time'].apply(datetime.utcfromtimestamp)

    # Step 3: Add 'hour_of_day' column
    sample['hour_of_day'] = sample['time'].dt.hour

    # Step 4: Use OrdinalEncoder on categorical columns (assumed to be pre-fitted)
    categorical_columns = ['category', 'merchant', 'job']
    
    # Fit encoder on the provided categorical columns for the current sample
    enc = OrdinalEncoder(dtype=np.int64)
    sample[categorical_columns] = enc.fit_transform(sample[categorical_columns])


    # Step 5: Select and return the relevant columns for the model
    return sample[features].set_index('transaction_id')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    button_type = data.get('button_type', '')

    # Select sample based on button type
    if button_type == 'fraud':
        sample = fraud_data.sample(n=1).to_dict(orient='records')[0]
    elif button_type == 'legit':
        sample = legitimate_data.sample(n=1).to_dict(orient='records')[0]
    else:
        return jsonify({'error': 'Invalid button type'}), 400

    # Convert the sample data to a DataFrame for preprocessing
    sample_df = pd.DataFrame([sample])

    # Step 6: Preprocess the sample before sending to the model
    preprocessed_sample = preprocess_sample(sample_df)

    # Step 7: Get prediction
    prediction = model.predict(preprocessed_sample)

    # Return the prediction and include actual fraud label for comparison
    actual_label = 'Fraud' if sample['fraud_label'] == 1 else 'Legitimate'
    predicted_label = 'Fraud' if prediction[0] == 1 else 'Legitimate'
    is_correct = prediction[0] == sample['fraud_label']

    response = {
        'prediction': predicted_label,
        'actual_label': actual_label,
        'prediction_correct': is_correct,
        'sample': sample
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
