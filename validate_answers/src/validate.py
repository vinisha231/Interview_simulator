# ============================================
# solution.py — StackOverflow Question Quality Prediction
# Models: Logistic Regression, Random Forest, DistilBERT
# ============================================

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

import torch
from datasets import Dataset
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    TrainingArguments,
    Trainer,
)

# -------------------------------------------------------------------
# Helper: make sure plots/ exists
# -------------------------------------------------------------------
os.makedirs("plots", exist_ok=True)

# -------------------------------------------------------------------
# Helper: Confusion matrix plotting
# -------------------------------------------------------------------
def plot_confusion_matrix(y_true, y_pred, labels, title, filename):
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation="nearest")
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(len(labels)),
        yticks=np.arange(len(labels)),
        xticklabels=labels,
        yticklabels=labels,
        ylabel="True label",
        xlabel="Predicted label",
        title=title,
    )

    plt.setp(
        ax.get_xticklabels(),
        rotation=45,
        ha="right",
        rotation_mode="anchor",
    )

    # Write numbers on cells
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j,
                i,
                format(cm[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm[i, j] > thresh else "black",
            )

    fig.tight_layout()
    out_path = os.path.join("plots", filename)
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    print(f"[saved] {title} → {out_path}")


# -------------------------------------------------------------------
# Helper: Accuracy comparison bar chart
# -------------------------------------------------------------------
def plot_accuracy_comparison(model_names, accuracies, filename):
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(model_names, accuracies)
    ax.set_ylim(0, 1)
    ax.set_ylabel("Accuracy")
    ax.set_title("Model Accuracy Comparison")

    for i, acc in enumerate(accuracies):
        ax.text(i, acc + 0.01, f"{acc:.2f}", ha="center")

    fig.tight_layout()
    out_path = os.path.join("plots", filename)
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    print(f"[saved] Accuracy comparison → {out_path}")


# ==========================================================
# 1. LOAD DATA
# ==========================================================

df = pd.read_csv("data/train.csv")

# Ensure required columns exist
print("Columns:", df.columns)

# ==========================================================
# 2. PREPROCESSING — Combine Title + Body into ONE text field
# ==========================================================

df["text"] = (df["Title"].astype(str) + " " + df["Body"].astype(str)).fillna("")
df = df[["text", "Y"]].dropna()

texts = df["text"]
labels = df["Y"]

print("Label distribution:\n", labels.value_counts())

# Fixed label order to use everywhere (metrics + confusion matrices)
label_list = sorted(labels.unique())  # e.g. ['HQ', 'LQ_CLOSE', 'LQ_EDIT']

# Mapping for DistilBERT (needs integer labels)
label2id = {lbl: i for i, lbl in enumerate(label_list)}
id2label = {i: lbl for lbl, i in label2id.items()}

# ==========================================================
# 3. TRAIN/TEST SPLIT
# ==========================================================

X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42, stratify=labels
)

# ==========================================================
# 4. TF-IDF + LOGISTIC REGRESSION
# ==========================================================

print("\n===== Logistic Regression =====\n")

tfidf = TfidfVectorizer(max_features=5000)
X_train_tfidf = tfidf.fit_transform(X_train)
X_test_tfidf = tfidf.transform(X_test)

log_reg = LogisticRegression(max_iter=200)
log_reg.fit(X_train_tfidf, y_train)

log_preds = log_reg.predict(X_test_tfidf)
log_acc = accuracy_score(y_test, log_preds)

print("Logistic Regression Accuracy:", log_acc)
print(classification_report(y_test, log_preds, labels=label_list))

# Confusion matrix for Logistic Regression
plot_confusion_matrix(
    y_test,
    log_preds,
    labels=label_list,
    title="Logistic Regression Confusion Matrix",
    filename="confusion_logistic.png",
)

# ==========================================================
# 5. TF-IDF + RANDOM FOREST
# ==========================================================

print("\n===== Random Forest =====\n")

rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_train_tfidf, y_train)

rf_preds = rf.predict(X_test_tfidf)
rf_acc = accuracy_score(y_test, rf_preds)

print("Random Forest Accuracy:", rf_acc)
print(classification_report(y_test, rf_preds, labels=label_list))

# Confusion matrix for Random Forest
plot_confusion_matrix(
    y_test,
    rf_preds,
    labels=label_list,
    title="Random Forest Confusion Matrix",
    filename="confusion_random_forest.png",
)

# ==========================================================
# 6. DISTILBERT FINE-TUNING
# ==========================================================

print("\n===== DistilBERT Fine-Tuning =====\n")

num_labels = len(label_list)
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

# Build pandas DataFrames with integer labels for BERT
train_df_bert = pd.DataFrame(
    {
        "text": X_train.values,
        "label": [label2id[y] for y in y_train],
    }
).reset_index(drop=True)

test_df_bert = pd.DataFrame(
    {
        "text": X_test.values,
        "label": [label2id[y] for y in y_test],
    }
).reset_index(drop=True)

# Convert to HuggingFace Datasets
train_dataset = Dataset.from_pandas(train_df_bert)
test_dataset = Dataset.from_pandas(test_df_bert)


def tokenize_fn(batch):
    return tokenizer(
        batch["text"],
        padding="max_length",
        truncation=True,
        max_length=256,
    )


train_dataset = train_dataset.map(tokenize_fn, batched=True)
test_dataset = test_dataset.map(tokenize_fn, batched=True)

train_dataset = train_dataset.remove_columns(["text"])
test_dataset = test_dataset.remove_columns(["text"])

train_dataset.set_format("torch")
test_dataset.set_format("torch")

# Load model
model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=num_labels,
    id2label=id2label,
    label2id=label2id,
)

# Training arguments
# NOTE: removed evaluation_strategy/logging_strategy/save_strategy
# to avoid your TypeError with TrainingArguments.
training_args = TrainingArguments(
    output_dir="./bert_results",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=1,  # you can increase to 2–3 if you have time/GPU
    learning_rate=2e-5,
    logging_steps=100,
)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
)

# Train
trainer.train()

# Evaluate on test set (HF metrics, mainly loss)
bert_results = trainer.evaluate()
print("\nDistilBERT raw trainer.evaluate() output:", bert_results)

# ----------------------------------------------------------
# Manual accuracy + classification report for DistilBERT
# ----------------------------------------------------------
def predict_bert(text_list):
    model.eval()
    all_preds = []

    # Run in small batches so it doesn’t blow up RAM
    batch_size = 16
    for i in range(0, len(text_list), batch_size):
        batch_texts = text_list[i : i + batch_size]
        inputs = tokenizer(
            batch_texts,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt",
        )
        with torch.no_grad():
            logits = model(**inputs).logits
        preds = torch.argmax(logits, dim=1).cpu().numpy()
        all_preds.extend(preds)

    return np.array(all_preds)


bert_pred_ids = predict_bert(list(X_test))
bert_preds = [id2label[i] for i in bert_pred_ids]

bert_acc = accuracy_score(y_test, bert_preds)

print("\nDistilBERT Accuracy:", bert_acc)
print(classification_report(y_test, bert_preds, labels=label_list))

# Confusion matrix for DistilBERT
plot_confusion_matrix(
    y_test,
    bert_preds,
    labels=label_list,
    title="DistilBERT Confusion Matrix",
    filename="confusion_distilbert.png",
)

# ==========================================================
# FINAL COMPARISON + BAR CHART
# ==========================================================

print("\n================ FINAL MODEL COMPARISON ================\n")
print(f"Logistic Regression: {log_acc:.4f}")
print(f"Random Forest:      {rf_acc:.4f}")
print(f"DistilBERT:         {bert_acc:.4f}")
print("\n=========================================================\n")

plot_accuracy_comparison(
    ["LogReg", "RandomForest", "DistilBERT"],
    [log_acc, rf_acc, bert_acc],
    filename="model_accuracy_comparison.png",
)