# Use Python 3.11.7 as a base image
FROM python:3.11.7-slim

# Set the working directory in the container
WORKDIR /app

# Install necessary packages
RUN apt-get update && apt-get install -y --fix-missing \
    g++ \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libpng-dev \
    libjpeg62-turbo-dev \
    libtiff5-dev \
    zlib1g-dev \
    libicu-dev \
    libpango1.0-dev \
    libcairo2-dev \
    curl \
    wget \
    lsb-release \
    gnupg \
    cmake \
    && rm -rf /var/lib/apt/lists/*


# Install Leptonica from source
RUN cd /tmp && \
    wget http://www.leptonica.org/source/leptonica-1.82.0.tar.gz && \
    tar xvf leptonica-1.82.0.tar.gz && \
    cd leptonica-1.82.0 && \
    ./configure && \
    make && \
    make install

# Install Tesseract from source
RUN cd /tmp && \
    wget https://github.com/tesseract-ocr/tesseract/archive/5.3.3.tar.gz && \
    tar xvf 5.3.3.tar.gz && \
    cd tesseract-5.3.3 && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    ldconfig

   
ENV TESSDATA_PREFIX=/tmp/tesseract-5.3.3/tessdata    

# Download the Serbian language data for Tesseract 5
#RUN wget -O /usr/local/share/tessdata/srp.traineddata https://github.com/tesseract-ocr/tessdata_best/blob/main/srp.traineddata
RUN wget -O $TESSDATA_PREFIX/srp.traineddata https://github.com/tesseract-ocr/tessdata_best/raw/main/srp.traineddata

RUN wget -O $TESSDATA_PREFIX/srp_latn.traineddata https://github.com/tesseract-ocr/tessdata_best/raw/main/srp_latn.traineddata


RUN pip install --no-cache-dir pymupdf

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install  --no-cache-dir -r requirements.txt

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV NAME World


CMD ["sh", "-c", "uvicorn upload_files:app --host 0.0.0.0 --port 8000 --workers ${NUMBER_OF_WORKERS}"]

# Command to run the FastAPI application using uvicorn
#CMD ["uvicorn", "upload_files:app", "--host", "0.0.0.0", "--port", "8000"]
#CMD ["uvicorn", "upload_files:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
