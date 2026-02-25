"""Train an LSTM model on collected sign language keypoint data.

Loads .npy sequences from MP_Data/, builds a 3-layer LSTM, trains with
EarlyStopping, and saves the model to models/action.h5.
"""

import os
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping

from config import ACTIONS, NO_SEQUENCES, SEQUENCE_LENGTH, DATA_PATH, MODEL_PATH

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
label_map = {label: num for num, label in enumerate(ACTIONS)}

sequences, labels = [], []
for action in ACTIONS:
    for sequence in np.array(os.listdir(os.path.join(DATA_PATH, action))).astype(int):
        window = []
        for frame_num in range(SEQUENCE_LENGTH):
            res = np.load(os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy"))
            window.append(res)
        sequences.append(window)
        labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(labels).astype(int)

print(f"Dataset shape: X={X.shape}, y={y.shape}")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05)
print(f"Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")

# ---------------------------------------------------------------------------
# Build model
# ---------------------------------------------------------------------------
model = Sequential()
model.add(LSTM(64, return_sequences=True, activation="relu", input_shape=(SEQUENCE_LENGTH, 1662)))
model.add(LSTM(128, return_sequences=True, activation="relu"))
model.add(LSTM(64, return_sequences=False, activation="relu"))
model.add(Dense(64, activation="relu"))
model.add(Dense(32, activation="relu"))
model.add(Dense(ACTIONS.shape[0], activation="softmax"))

model.compile(optimizer="Adam", loss="categorical_crossentropy", metrics=["categorical_accuracy"])
model.summary()

# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------
log_dir = os.path.join(os.path.dirname(__file__), "Logs")
tb_callback = TensorBoard(log_dir=log_dir)
es_callback = EarlyStopping(monitor="categorical_accuracy", patience=50, restore_best_weights=True)

model.fit(X_train, y_train, epochs=2000, callbacks=[tb_callback, es_callback])

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
loss, accuracy = model.evaluate(X_test, y_test)
print(f"\nTest loss: {loss:.4f}, Test accuracy: {accuracy:.4f}")

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
model.save(MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
