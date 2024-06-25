from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import io
import base64
import os
import filetype
from log_config import logger

from doc_sort import file_to_txt

language = "srp"
username_gl = ""



app = FastAPI()

# Configure CORS dynamically
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

async def validate_file_mime(upload_file: UploadFile, allowed_mimes: set):
    # Read the content of the file
    file_content = upload_file.file.read()
    upload_file.file.seek(0)  # Reset file pointer to the beginning for further processing
    
    # Check MIME type using the filetype library
    kind = filetype.guess(file_content)
    if kind is None:
        logger.error(f"{username_gl}: Could not determine the file type.")
        raise HTTPException(status_code=400, detail="Could not determine the file type.")
    
    mime = kind.mime
    if mime not in allowed_mimes:
        logger.error(f"{username_gl}: An error occurred: Unsupported file type: {mime}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime}")
    
    return file_content


async def process_file(file: UploadFile, use_extended: bool, language_sent: str, usernamemy: str):
    try:
        # Validate file MIME type
        allowed_mimes = {'application/pdf'}
        file_content = await validate_file_mime(file, allowed_mimes)
        
        file_like_object = io.BytesIO(file_content)
        text, is_there_better, highlighted_pdf_stream = await file_to_txt(file_like_object, file.filename, use_extended, language_sent, usernamemy)
        return file_content, text, is_there_better, highlighted_pdf_stream
    except Exception as e:
        logger.error(f"{username_gl}: An error occurred: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"PDF is invalid.")

def encode_pdf(stream):
    stream.seek(0)
    pdf_bytes = stream.read()
    return base64.b64encode(pdf_bytes).decode('utf-8')
    


@app.post("/api-pdf-reader/upload/")
async def upload_files(language_sent: str = Form(None), file: UploadFile = File(...), username: str = Form(...)):

    try:
        if language_sent is None:
            language_sent = language
        
        username_gl = username
        #print(username_gl)

        file_content, text, is_there_better, highlighted_pdf_stream = await process_file(file, False, language_sent, username_gl)
        

        if highlighted_pdf_stream:
            pdf_base64 = encode_pdf(highlighted_pdf_stream)
        else:
            pdf_base64 = None

        return {
            "message": text,
            "is_there_better": is_there_better,
            "highlighted_pdf": pdf_base64
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Doslo je do greske prilikom rada sa Vasim PDF-om, molimo proverite da li je on ispravan.")


'''async def process_file_second(file: UploadFile, use_extended: bool, language_sent: str):
    try:
        # Validate file MIME type
        #allowed_mimes = {'application/pdf'}
        #file_content = await validate_file_mime(file, allowed_mimes)
        logger.info(f"Stigoh ovde 1: ")
        file_content = await file.read()
        logger.info(f"Stigoh ovde 2: ")
        file_like_object = io.BytesIO(file_content)
        logger.info(f"Stigoh ovde 3: ")
        text, is_there_better, highlighted_pdf_stream = await file_to_txt(file_like_object, file.filename, use_extended, language_sent)
        logger.info(f"Stigoh ovde 4: ")
        return file_content, text, is_there_better, highlighted_pdf_stream
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"PDF is invalid.")'''


@app.post("/api-pdf-reader/second_upload/")
async def second_upload_files(language_sent: str = Form(None), file: UploadFile = File(...), username: str = Form(...)):

    try:
        if language_sent is None:
            language_sent = language

        username_gl = username
        #print(username_gl)

        file_content, text, is_there_better, highlighted_pdf_stream = await process_file(file, True, language_sent, username_gl)
        
        pdf_base64 = encode_pdf(highlighted_pdf_stream) if highlighted_pdf_stream else None

        return {
            "message": text,
            "is_there_better": False,  # Assuming always False as in your initial example
            "highlighted_pdf": pdf_base64
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Doslo je do greske prilikom rada sa Vasim PDF-om, molimo proverite da li je on ispravan.")

