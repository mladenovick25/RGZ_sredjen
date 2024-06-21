import PyPDF2

def extract_page(pdf_path, page_number, output_path):
    reader = PyPDF2.PdfReader(pdf_path)
    writer = PyPDF2.PdfWriter()
    
    # Add the desired page (zero-indexed)
    writer.add_page(reader.pages[page_number - 1])

    # Write to a new PDF
    with open(output_path, 'wb') as output_pdf:
        writer.write(output_pdf)

# Example usage: extract the 3rd page of 'example.pdf' and save it as 'output.pdf'
extract_page('app/backend/2.pdf', 2, 'app/backend/output.pdf')
