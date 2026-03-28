"""Train an LSTM model on collected sign language keypoint data.

Loads .npy sequences from MP_Data/, builds a 3-layer LSTM with Dropout,
trains with EarlyStopping + ReduceLROnPlateau, and saves the model to
models/action.h5.  Training history is saved as JSON for evaluate.py.
"""

import json
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import (
    TensorBoard,
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)

from config import ACTIONS, NO_SEQUENCES, SEQUENCE_LENGTH, DATA_PATH, MODEL_PATH

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
label_map = {label: num for num, label in enumerate(ACTIONS)}

sequences, labels = [], []
for action in ACTIONS:
    action_dir = os.path.join(DATA_PATH, action)
    if not os.path.isdir(action_dir):
        print(f"WARNING: No data directory for '{action}', skipping")
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

# Zero out face landmarks — they add noise for hand-sign classification
# Feature layout: pose[0:132] + face[132:1536] + lh[1536:1599] + rh[1599:1662]
FACE_START, FACE_END = 132, 1536
X[:, :, FACE_START:FACE_END] = 0.0
print(f"Dataset shape: X={X.shape}, y={y.shape}")
print(f"Classes: {list(ACTIONS)}")
print(f"Masked face landmarks: columns {FACE_START}:{FACE_END} ({FACE_END - FACE_START} features zeroed)")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, stratify=np.argmax(y, axis=1), random_state=42
)

# ---------------------------------------------------------------------------
# Build model (scaled for 13 classes)
# ---------------------------------------------------------------------------
model = Sequential()
model.add(LSTM(64, return_sequences=True, activation="relu", input_shape=(SEQUENCE_LENGTH, 1662)))
model.add(Dropout(0.3))
model.add(LSTM(128, return_sequences=True, activation="relu"))
model.add(Dropout(0.3))
model.add(LSTM(64, return_sequences=False, activation="relu"))
model.add(Dropout(0.3))
model.add(Dense(64, activation="relu"))
model.add(Dense(32, activation="relu"))
model.add(Dense(ACTIONS.shape[0], activation="softmax"))

model.compile(optimizer="Adam", loss="categorical_crossentropy", metrics=["categorical_accuracy"])
model.summary()

# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------
log_dir = os.path.join(os.path.dirname(__file__), "Logs")
eval_dir = os.path.join(os.path.dirname(__file__), "eval_outputs")
os.makedirs(eval_dir, exist_ok=True)

tb_callback = TensorBoard(log_dir=log_dir)
es_callback = EarlyStopping(
    monitor="val_loss", patience=50, restore_best_weights=True, min_delta=0.001
)
mc_callback = ModelCheckpoint(
    MODEL_PATH, monitor="val_loss", save_best_only=True, verbose=1
)
lr_callback = ReduceLROnPlateau(
    monitor="val_loss", factor=0.5, patience=25, min_lr=1e-6, verbose=1
)

class_weights = compute_class_weight(
    "balanced", classes=np.unique(np.argmax(y_train, axis=1)), y=np.argmax(y_train, axis=1)
)
class_weight_dict = dict(enumerate(class_weights))
print(f"Class weights: {class_weight_dict}")

history = model.fit(
    X_train, y_train, epochs=2000, validation_split=0.2,
    callbacks=[tb_callback, es_callback, mc_callback, lr_callback],
    class_weight=class_weight_dict,
)

# Save training history for evaluate.py
history_path = os.path.join(eval_dir, "training_history.json")
with open(history_path, "w") as f:
    json.dump({k: [float(v) for v in vals] for k, vals in history.history.items()}, f)
print(f"Training history saved to: {history_path}")

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
loss, accuracy = model.evaluate(X_test, y_test)
print(f"\nTest loss: {loss:.4f}, Test accuracy: {accuracy:.4f}")

y_pred = np.argmax(model.predict(X_test), axis=1)
y_true = np.argmax(y_test, axis=1)

print("\n--- Confusion Matrix ---")
cm = confusion_matrix(y_true, y_pred)
print(cm)

print("\n--- Classification Report ---")
print(classification_report(y_true, y_pred, target_names=list(ACTIONS)))

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
model.save(MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
