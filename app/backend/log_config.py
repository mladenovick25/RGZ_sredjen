import os
import logging
from logging.handlers import RotatingFileHandler

try:
    os.makedirs('logs', exist_ok=True)
except FileExistsError:
    # If the directory already exists, we can safely ignore this error
    pass

# Setup a shared logger
logger = logging.getLogger("shared_logger")
logger.setLevel(logging.INFO)

# Create a file handler for output file in 'logs/' directory
handler = RotatingFileHandler('logs/application.log', maxBytes=1048576, backupCount=5)
handler.setLevel(logging.INFO)

# Create a formatter and set it to the handler
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add the handler to the logger
logger.addHandler(handler)
