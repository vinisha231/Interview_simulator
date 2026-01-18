README — StackOverflow Answer Quality Prediction

Author: Vinisha Bala Dhayanidhi
Course: CSS 486 – Machine Learning
Project: Final Project — Answer Quality Prediction with TF–IDF Baselines + DistilBERT
Date: December 2025

1. Project Overview

This project builds a complete NLP pipeline for predicting answer quality on StackOverflow.
Three models are implemented and evaluated:
	1.	Logistic Regression (TF–IDF)
	2.	Random Forest (TF–IDF)
	3.	DistilBERT Fine-Tuned Classifier

Also:
	•	All models generate confusion matrices and accuracy metrics.
	•	A set of screenshots shows the models running successfully.
	•	The project follows the ACM scientific report format.


2. Repository Structure

validate_answers/
│
├── data/
│   └── train.csv                     # Full training dataset (45,000 rows)
│
├── src/
│   ├── validate.py                   # Main script running all models
│
├── plots/
│   ├── confusion_logistic.png
│   ├── confusion_random_forest.png 
│
├── screenshots/
│   ├──Screenshot 2025-12-08 at 4.54.27 PM 1.png #screenshot of logistic regression, random forest, and distilbert training 
│
└── README.md                         # (this file)

 

3. Installation Instructions

3.1. Create a Virtual Environment  

python3 -m venv .venv
source .venv/bin/activate

3.2. Install Dependencies

Important: PyTorch must support CPU/MPS on macOS.

pip install numpy<2
pip install pandas scikit-learn matplotlib tqdm
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers datasets accelerate
 

4. Running the Project

All experiments can be executed with a single command:

python src/validate.py

This script will:

Step 1 — Load Dataset
	•	Reads data/train.csv
	•	Combines Title + Body into one text field
	•	Produces label statistics

Step 2 — Run Logistic Regression (TF–IDF)

Outputs:
	•	Accuracy
	•	Precision / Recall / F1
	•	Saved confusion matrix: plots/confusion_logistic.png

Step 3 — Run Random Forest (TF–IDF)

Outputs:
	•	Accuracy
	•	Precision / Recall / F1
	•	Saved confusion matrix: plots/confusion_random_forest.png

Step 4 — Fine-Tune DistilBERT
	•	Tokenizes data
	•	Maps labels into integers
	•	Trains DistilBERT for 1 epoch
	•	Logs loss and learning rate during training
	•	Computes classification report
	•	Saves confusion matrix: plots/confusion_distilbert.png

Step 5 — Produce Accuracy Comparison

Saved at:
plots/accuracy_comparison.png
 

5. Example Screenshots (Proof of Execution)

Located in the folder:

screenshots/

Screenshot 2025-12-08 at 4.54.27 PM 1.png - Shows Logistic Regression output, Random Forest running, DistilBERT fine-tuning progress

These are provided as required evidence that the code was successfully executed.


6. Technical Specifications
	•	Device: MacBook Pro (Apple Silicon)
	•	Python: 3.12
	•	NumPy: 1.26.4
	•	PyTorch: 2.2+ (CPU/MPS backend)
	•	Transformers: 4.57
	•	Dataset Size: 45,000 examples (balanced across 3 labels)
	•	Runtime:
	•	Logistic Regression: ~10 sec
	•	Random Forest: ~20 sec
	•	DistilBERT (1 epoch): ~65–75 min on CPU/MPS


7. Reproducibility Notes
	•	All random seeds are fixed inside scikit-learn.
	•	DistilBERT randomness exists but produces consistent accuracy ranges.
	•	All plots are automatically generated into plots/ folder.
	•	No external API calls required — purely local computation.


8. Known Issues

NumPy 2.x Incompatibility

PyTorch currently requires NumPy < 2, so downgrade was necessary:

pip install "numpy<2" --force-reinstall

Accelerate Missing

HuggingFace Trainer requires:

pip install accelerate

Both issues are fully resolved in this README.


9. Citation

If referencing this project, cite the attached ACM-style paper:

Bala Dhayanidhi, V. (2025). Predicting Answer Quality with DistilBERT: 
A Comprehensive System for NLP-Based Content Evaluation and Explainability. 
CSS 486 Final Project, University of Washington Bothell.

10. Contact

Vinisha Bala Dhayanidhi
Email: vdhaya@uw.edu
University of Washington Bothell
  