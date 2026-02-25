import os
import numpy as np

# Actions must match backend/services/model_service.py ACTIONS list (same order)
ACTIONS = np.array(["Encik", "Tolong", "Saya"])

# Data collection parameters
NO_SEQUENCES = 30       # Number of video sequences per action
SEQUENCE_LENGTH = 30    # Number of frames per sequence

# Paths
DATA_PATH = os.path.join(os.path.dirname(__file__), "MP_Data")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "action.h5")
