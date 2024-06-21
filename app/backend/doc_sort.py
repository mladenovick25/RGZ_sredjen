import pdfplumber # type: ignore
from log_config import logger

from tesseract_based import highlight_low_confidence_words_in_images



async def file_to_txt(file_content, file_name, is_it_second, language, username_gl):

    if file_name.lower().endswith(".pdf") :

        is_there_better = False

        text = ""
        highlighted_pdf = None
        '''with pdfplumber.open(file_content) as pdf:
            for page in pdf.pages:
                text += page.extract_text()'''


        try:
            with pdfplumber.open(file_content) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
        except TypeError as e:
            logger.info(f"{username_gl}: TypeError while processing PDF file: {file_name}. Trying second way.")
            text = ""
        except Exception as e:
            logger.error(f"{username_gl}: Unexpected error while processing PDF file: {file_name}. Error: {e}")
            return "", False, None  # Or handle the error differently


        

        if text == "" or is_it_second:
            #print(len(pdf.pages))
            current_text, highlighted_pdf = highlight_low_confidence_words_in_images(file_content, language)
        else:
            current_text = text
            is_there_better = True

        logger.info(f"{username_gl}: Processed PDF file: {file_name}.")

        return current_text, is_there_better, highlighted_pdf
    
    else:
        logger.info(f"{username_gl}: File: {file_name} is a bad type.")

        return "", False, None

            

    
