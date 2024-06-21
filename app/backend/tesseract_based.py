import io
import fitz  # PyMuPDF
import pytesseract # type: ignore
from PIL import Image, ImageDraw, ImageFilter


custom_config = r'--psm 6'


def pdf_to_images(pdf_content, zoom_factor=3):
    doc = fitz.open("pdf", pdf_content)
    images = []
    for page_number in range(len(doc)):
        page = doc.load_page(page_number)
        # Set zoom factor; larger values yield higher resolution images
        mat = fitz.Matrix(zoom_factor, zoom_factor)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        #img = img.filter(ImageFilter.SHARPEN)
        images.append(img)
    return images

def save_images_to_pdf(images, output_path):
    # Ensure all images are converted to RGB mode if not already
    rgb_images = [img.convert('RGB') if img.mode != 'RGB' else img for img in images]
    # Save the resized images to a PDF
    rgb_images[0].save(output_path, save_all=True, append_images=rgb_images[1:])


def convert_images_to_pdf(images):
    # Ensure all images are converted to RGB mode if not already
    rgb_images = [img.convert('RGB') if img.mode != 'RGB' else img for img in images]
    
    # Create a byte stream buffer
    pdf_bytes = io.BytesIO()
    
    # Save the resized images to a PDF in memory
    rgb_images[0].save(pdf_bytes, 'PDF', save_all=True, append_images=rgb_images[1:])
    
    # Move the cursor to the beginning of the stream
    pdf_bytes.seek(0)
    
    # Return the byte stream
    return pdf_bytes


def highlight_low_confidence_words_in_images(pdf_content, language):

    images = pdf_to_images(pdf_content, zoom_factor=3)

    full_full_text = ''

    for i, img in enumerate(images):
        #img = imgg.convert('L')
        draw = ImageDraw.Draw(img)
        ocr_data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)

        ocr_data_DODATAK = pytesseract.image_to_data(img, lang=language, config=custom_config, output_type=pytesseract.Output.DICT)
        
        #ocr_data = pytesseract.image_to_data(img, lang=language, config=custom_config, output_type=pytesseract.Output.DICT)
        #print(str(ocr_data['text']) + "\n\n\n")


        full_text = pytesseract.image_to_string(img, lang=language)
        #full_text = pytesseract.image_to_string(img, config=custom_config, lang=language)

        #print(full_text + "\n\n\n")
        
        # Draw rectangles around low confidence words
        for j in range(len(ocr_data['level'])):
            if int(ocr_data['conf'][j]) >= 0 and int(ocr_data['conf'][j]) < 85:  # Confidence less than 80%
                (x, y, w, h) = (ocr_data['left'][j], ocr_data['top'][j], ocr_data['width'][j], ocr_data['height'][j])
                draw.rectangle([x, y, x + w, y + h], outline="red", width=2)  # Only outline with no fill
        
        # Optionally save or show the image
        #img.save(f'highlighted_page_{i}.png')
        #img.show()

        #print(full_text)

        # Initialize variables to track the position in the full text
        pos = 0
        modified_full_text = ''

        pomocni_pos = 0
        pomocni_len = len(ocr_data_DODATAK['level'])
        (xp, yp, wp, hp) = (0,0,0,0)

        #print(ocr_data_DODATAK['text'])
        # Iterate through each word in the OCR data
        for i, word in enumerate(ocr_data['text']):
            if word.strip():  # Ensure there is a word
                start_idx = full_text.find(word, pos)
                if start_idx == -1:
                    # If word is not found, skip to the next
                    continue

                (xw, yw, ww, hw) = (ocr_data['left'][i], ocr_data['top'][i], ocr_data['width'][i], ocr_data['height'][i])
                
                preklapa_y = 0
                preklapa_h = 0
                #print(ocr_data_DODATAK['text'])
                while pomocni_pos < pomocni_len:
                    #print(ocr_data_DODATAK['text'][pomocni_pos])
                    #print(pomocni_pos)
                    (x, y, w, h) = (ocr_data_DODATAK['left'][pomocni_pos], ocr_data_DODATAK['top'][pomocni_pos], ocr_data_DODATAK['width'][pomocni_pos], ocr_data_DODATAK['height'][pomocni_pos])
                    if (y + h) < (yw) and (yp + hp) < (y):
                        if (preklapa_y + preklapa_h) > y:
                            modified_full_text += ' '
                        else:
                            modified_full_text += '\n'
                        '''print(i)
                        print(word)
                        print(pomocni_pos)
                        print(ocr_data_DODATAK['text'][pomocni_pos])
                        print(yp)
                        print(hp)
                        print(y)
                        print(h)
                        print(yw)
                        print(hw)'''
                        #print(' ' + yp + ' ' + hp + ' ' + y + ' ' + h + ' ' + yw + ' ' + hw)
                        modified_full_text += ("@@" + ocr_data_DODATAK['text'][pomocni_pos])
                        draw.rectangle([x, y, x + w, y + h], outline="red", width=2) 
                        (preklapa_y, preklapa_h) = (y, h)
                        pomocni_pos += 1

                    elif (yp + hp) >= (y):
                        pomocni_pos += 1
                    else:
                        break

                (xp, yp, wp, hp) = (xw, yw, ww, hw)

                # Append the text before the word (including new lines and spaces)
                modified_full_text += full_text[pos:start_idx]

                # Check the confidence
                if int(ocr_data['conf'][i]) < 85:
                    # Replace low-confidence words with '@' per character
                    modified_full_text += ("@@" + word) #* len(word)
                else:
                    # Append the original word if confidence is high enough
                    modified_full_text += word

                # Update the position marker to end of the current word
                pos = start_idx + len(word)

        # Append any remaining text after the last word
        modified_full_text += full_text[pos:]

        #print(modified_full_text)
        full_full_text += modified_full_text
        full_full_text += "\n\n"
    
    #save_images_to_pdf(images, 'output.pdf')
    pdf_stream = convert_images_to_pdf(images)
    return full_full_text, pdf_stream
