from flask import Flask, render_template, request, jsonify
import pickle
import string
from nltk.corpus import stopwords
import nltk
from nltk.stem.porter import PorterStemmer
from flask_cors import CORS

# Ensure NLTK data is downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

ps = PorterStemmer()

def transform_text(text):
    text = text.lower()
    text = nltk.word_tokenize(text)

    y = []
    for i in text:
        if i.isalnum():
            y.append(i)

    text = y[:]
    y.clear()

    for i in text:
        if i not in stopwords.words('english') and i not in string.punctuation:
            y.append(i)

    text = y[:]
    y.clear()

    for i in text:
        y.append(ps.stem(i))

    return " ".join(y)

# Load model and vectorizer
try:
    tfidf = pickle.load(open('vectorizer.pkl','rb'))
    model = pickle.load(open('model.pkl','rb'))
except Exception as e:
    print(f"Error loading model/vectorizer: {e}")
    tfidf = None
    model = None

@app.route('/', methods=['GET', 'POST'])
def home():
    result = None
    message = None
    if request.method == 'POST':
        message = request.form['message']
        if model and tfidf:
            # 1. preprocess
            transformed_sms = transform_text(message)
            # 2. vectorize
            vector_input = tfidf.transform([transformed_sms])
            # 3. predict
            prediction = model.predict(vector_input)[0]
            # 4. Display
            if prediction == 1:
                result = "Smishing"
            else:
                result = "Not Smishing"
        else:
             result = "Model not loaded"
            
    return render_template('index.html', result=result, message=message)

@app.route('/api/predict', methods=['POST'])
def api_predict():
    if not model or not tfidf:
        return jsonify({"error": "Model or vectorizer not loaded"}), 500

    data = request.get_json() or {}
    message = data.get('message', '').strip()

    if not message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # 1. preprocess
        transformed_sms = transform_text(message)
        # 2. vectorize
        vector_input = tfidf.transform([transformed_sms])
        
        # 3. predict
        # Check if model supports probability
        confidence = 0.0
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(vector_input)[0]
            # Assuming class 1 is Smishing
            smishing_prob = proba[1]
            confidence = smishing_prob if smishing_prob > 0.5 else proba[0]
            risk_score = smishing_prob * 100
        else:
            # Fallback if no probability
            prediction = model.predict(vector_input)[0]
            risk_score = 100.0 if prediction == 1 else 0.0
            confidence = 1.0 # Certainty of the hard prediction
        
        # Get hard prediction for label
        prediction_label = model.predict(vector_input)[0]
        label = "Smishing" if prediction_label == 1 else "Not Smishing"

        return jsonify({
            "original_message": message,
            "prediction": label,
            "confidence": float(confidence),
            "riskScore": float(risk_score)
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
