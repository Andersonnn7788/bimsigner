"""Comprehensive evaluation pipeline for the BIM sign language LSTM model.

Generates publication-quality outputs: confusion matrix heatmap,
per-class precision/recall/F1, training curves, inference latency
benchmarks, and model summary.

Usage:
    python evaluate.py
    python evaluate.py --model ../models/action.h5
    python evaluate.py --skip-history
"""

import argparse
import json
import os
import sys
import time

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving figures
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import to_categorical

from config import ACTIONS, DATA_PATH, MODEL_PATH, NO_SEQUENCES, SEQUENCE_LENGTH

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------
EVAL_DIR = os.path.join(os.path.dirname(__file__), "eval_outputs")
os.makedirs(EVAL_DIR, exist_ok=True)

FACE_START, FACE_END = 132, 1536


def load_data():
    """Load and preprocess keypoint data (same logic as train_model.py)."""
    label_map = {label: num for num, label in enumerate(ACTIONS)}
    sequences, labels = [], []

    for action in ACTIONS:
        action_dir = os.path.join(DATA_PATH, action)
        if not os.path.isdir(action_dir):
            print(f"  WARNING: No data for '{action}', skipping")
            continue
        for sequence in np.array(os.listdir(action_dir)).astype(int):
            window = []
            for frame_num in range(SEQUENCE_LENGTH):
                res = np.load(os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy"))
                window.append(res)
            sequences.append(window)
            labels.append(label_map[action])

    X = np.array(sequences)
    y = to_categorical(labels, num_classes=len(ACTIONS)).astype(int)

    # Zero face landmarks
    X[:, :, FACE_START:FACE_END] = 0.0
    return X, y


def generate_confusion_matrix(y_true, y_pred, action_names):
    """Save confusion matrix heatmaps (raw counts + normalized)."""
    cm = confusion_matrix(y_true, y_pred)

    # Raw counts
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=action_names,
                yticklabels=action_names, ax=ax)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title("Confusion Matrix (Counts)", fontsize=14)
    plt.tight_layout()
    path = os.path.join(EVAL_DIR, "confusion_matrix.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  Saved: {path}")

    # Normalized (recall per class)
    cm_norm = cm.astype("float") / cm.sum(axis=1, keepdims=True)
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="Blues", xticklabels=action_names,
                yticklabels=action_names, ax=ax, vmin=0, vmax=1)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title("Confusion Matrix (Normalized / Recall)", fontsize=14)
    plt.tight_layout()
    path = os.path.join(EVAL_DIR, "confusion_matrix_normalized.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  Saved: {path}")

    return cm


def generate_classification_report(y_true, y_pred, action_names):
    """Save per-class precision, recall, F1 as text and CSV."""
    report_str = classification_report(y_true, y_pred, target_names=action_names)
    report_dict = classification_report(y_true, y_pred, target_names=action_names, output_dict=True)

    # Text report
    txt_path = os.path.join(EVAL_DIR, "classification_report.txt")
    with open(txt_path, "w") as f:
        f.write("BIM Sign Language Model — Classification Report\n")
        f.write("=" * 60 + "\n\n")
        f.write(report_str)
    print(f"  Saved: {txt_path}")

    # CSV report
    csv_path = os.path.join(EVAL_DIR, "classification_report.csv")
    with open(csv_path, "w") as f:
        f.write("class,precision,recall,f1-score,support\n")
        for name in action_names:
            m = report_dict[name]
            f.write(f"{name},{m['precision']:.4f},{m['recall']:.4f},{m['f1-score']:.4f},{int(m['support'])}\n")
        for key in ["macro avg", "weighted avg"]:
            m = report_dict[key]
            f.write(f"{key},{m['precision']:.4f},{m['recall']:.4f},{m['f1-score']:.4f},{int(m['support'])}\n")
    print(f"  Saved: {csv_path}")

    # Flag weak classes
    weak = [n for n in action_names if report_dict[n]["f1-score"] < 0.8]
    if weak:
        print(f"  WARNING: Low F1 (<0.8) classes: {weak}")

    return report_str


def generate_training_curves(history_path):
    """Plot training/validation loss and accuracy curves."""
    if not os.path.isfile(history_path):
        print(f"  SKIP: No training history at {history_path}")
        return

    with open(history_path) as f:
        history = json.load(f)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Loss
    epochs = range(1, len(history["loss"]) + 1)
    ax1.plot(epochs, history["loss"], label="Training Loss", linewidth=1.5)
    ax1.plot(epochs, history["val_loss"], label="Validation Loss", linewidth=1.5)
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.set_title("Training & Validation Loss")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Accuracy
    acc_key = "categorical_accuracy" if "categorical_accuracy" in history else "accuracy"
    val_acc_key = f"val_{acc_key}"
    ax2.plot(epochs, history[acc_key], label="Training Accuracy", linewidth=1.5)
    ax2.plot(epochs, history[val_acc_key], label="Validation Accuracy", linewidth=1.5)
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy")
    ax2.set_title("Training & Validation Accuracy")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    path = os.path.join(EVAL_DIR, "training_curves.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  Saved: {path}")


def benchmark_inference(model, n_runs=100):
    """Benchmark inference latency with random input."""
    dummy_input = np.random.randn(1, SEQUENCE_LENGTH, 1662).astype(np.float32)
    dummy_input[:, :, FACE_START:FACE_END] = 0.0

    # Warmup
    for _ in range(5):
        model.predict(dummy_input, verbose=0)

    latencies = []
    for _ in range(n_runs):
        t0 = time.perf_counter()
        model.predict(dummy_input, verbose=0)
        latencies.append((time.perf_counter() - t0) * 1000)  # ms

    latencies = np.array(latencies)
    stats = {
        "mean_ms": float(np.mean(latencies)),
        "median_ms": float(np.median(latencies)),
        "p95_ms": float(np.percentile(latencies, 95)),
        "p99_ms": float(np.percentile(latencies, 99)),
        "min_ms": float(np.min(latencies)),
        "max_ms": float(np.max(latencies)),
    }

    txt_path = os.path.join(EVAL_DIR, "inference_latency.txt")
    with open(txt_path, "w") as f:
        f.write("BIM Sign Language Model — Inference Latency Benchmark\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Runs: {n_runs}\n")
        f.write(f"Input shape: (1, {SEQUENCE_LENGTH}, 1662)\n\n")
        for k, v in stats.items():
            f.write(f"  {k:>12s}: {v:8.2f} ms\n")
    print(f"  Saved: {txt_path}")
    return stats


def save_model_summary(model, model_path):
    """Save model architecture and parameter count."""
    lines = []
    model.summary(print_fn=lambda x: lines.append(x))
    summary_str = "\n".join(lines)

    model_size_mb = os.path.getsize(model_path) / (1024 * 1024) if os.path.isfile(model_path) else 0

    txt_path = os.path.join(EVAL_DIR, "model_summary.txt")
    with open(txt_path, "w") as f:
        f.write("BIM Sign Language Model — Architecture Summary\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Model file: {model_path}\n")
        f.write(f"Model size: {model_size_mb:.2f} MB\n")
        f.write(f"Total parameters: {model.count_params():,}\n")
        f.write(f"Input shape: ({SEQUENCE_LENGTH}, 1662)\n")
        f.write(f"Output classes: {len(ACTIONS)}\n")
        f.write(f"Actions: {list(ACTIONS)}\n\n")
        f.write(summary_str)
    print(f"  Saved: {txt_path}")


def generate_summary(test_loss, test_acc, report_str, latency_stats, cm):
    """Compile a combined human-readable evaluation summary."""
    txt_path = os.path.join(EVAL_DIR, "evaluation_summary.txt")
    with open(txt_path, "w") as f:
        f.write("=" * 60 + "\n")
        f.write("  BIM Sign Language Model — Evaluation Summary\n")
        f.write("=" * 60 + "\n\n")

        f.write(f"Number of classes: {len(ACTIONS)}\n")
        f.write(f"Actions: {list(ACTIONS)}\n\n")

        f.write("--- Test Set Performance ---\n")
        f.write(f"  Test Loss:     {test_loss:.4f}\n")
        f.write(f"  Test Accuracy: {test_acc:.4f} ({test_acc*100:.1f}%)\n\n")

        f.write("--- Per-Class Metrics ---\n")
        f.write(report_str + "\n")

        f.write("--- Inference Latency ---\n")
        for k, v in latency_stats.items():
            f.write(f"  {k:>12s}: {v:8.2f} ms\n")
        f.write("\n")

        f.write("--- Artifacts ---\n")
        f.write("  confusion_matrix.png            Confusion matrix (counts)\n")
        f.write("  confusion_matrix_normalized.png  Confusion matrix (recall %)\n")
        f.write("  training_curves.png             Loss & accuracy over epochs\n")
        f.write("  classification_report.txt/csv   Per-class P/R/F1\n")
        f.write("  inference_latency.txt           Latency benchmark\n")
        f.write("  model_summary.txt               Architecture & params\n")
    print(f"  Saved: {txt_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Evaluate BIM LSTM model")
    parser.add_argument("--model", default=MODEL_PATH, help="Path to .h5 model")
    parser.add_argument("--skip-history", action="store_true", help="Skip training curves")
    args = parser.parse_args()

    print(f"\nBIM Sign Language Model Evaluation")
    print(f"{'='*60}")
    print(f"Model: {args.model}")
    print(f"Actions: {list(ACTIONS)} ({len(ACTIONS)} classes)\n")

    # Load data
    print("[1/6] Loading data...")
    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, stratify=np.argmax(y, axis=1), random_state=42
    )
    print(f"  Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples\n")

    # Load model
    print("[2/6] Loading model...")
    model = load_model(args.model)
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"  Test loss: {test_loss:.4f}, Test accuracy: {test_acc:.4f}\n")

    y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
    y_true = np.argmax(y_test, axis=1)
    action_names = list(ACTIONS)

    # Confusion matrix
    print("[3/6] Generating confusion matrix...")
    cm = generate_confusion_matrix(y_true, y_pred, action_names)
    print()

    # Classification report
    print("[4/6] Generating classification report...")
    report_str = generate_classification_report(y_true, y_pred, action_names)
    print()

    # Training curves
    print("[5/6] Generating training curves...")
    if args.skip_history:
        print("  SKIPPED (--skip-history)")
    else:
        history_path = os.path.join(EVAL_DIR, "training_history.json")
        generate_training_curves(history_path)
    print()

    # Inference latency
    print("[6/6] Benchmarking inference latency...")
    latency_stats = benchmark_inference(model)
    print()

    # Model summary
    print("Saving model summary...")
    save_model_summary(model, args.model)
    print()

    # Combined summary
    print("Generating evaluation summary...")
    generate_summary(test_loss, test_acc, report_str, latency_stats, cm)
    print()

    print(f"{'='*60}")
    print(f"All evaluation artifacts saved to: {EVAL_DIR}")
    print(f"Test Accuracy: {test_acc*100:.1f}%")
    print(f"Inference Latency (median): {latency_stats['median_ms']:.1f}ms")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
