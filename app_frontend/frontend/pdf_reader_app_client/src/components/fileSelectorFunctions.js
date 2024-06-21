import axios from 'axios';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import keycloak from './keycloak';

const backend_path = process.env.VUE_APP_BACKEND_PATH;
//const backend_path = 'http://localhost:8000/api';//process.env.VUE_APP_BACKEND_PATH;
//console.log('Route Prefix:', backend_path);

export default {
  data() {
    return {
      file: null,
      file_name: "",
      pdfFile: null,
      isDragging: false,
      is_there_better: false,
      alertMessage: '',
      firstText: "",
      secondText: "",
      backActive: false,
      fileUploaded: false, // Initially set to false
      isLoading: false, // Initially set to false
      currentPage: 1,
			pageCount: 10,
      pdfViewer: null,
      pageNumber: 1,
      highlighted_pdf: null,
      selectedLanguage: 'srp'
    };
  },
  computed: {
    formattedAlertMessage() {
      const escapeHtml = (text) => {
        return text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
      };
      const escapedMessage = escapeHtml(this.alertMessage);

      //return escapedMessage.replace(/(?<=\s)@(\S*)/g, '<span style="color: red;">$1</span>');
      return escapedMessage.replace(/(?<=\s|^)@@(\S*)/g, '<span style="color: red;">$&</span>');
      // return escapedMessage.replace(/@/g, '<span style="color: red;">@</span>');
    }
  },
  methods: {
    handleInput(event) {
      const range = this.saveCursorPosition(); // Save cursor position
      const newText = event.target.innerText;
      if (newText !== this.alertMessage) {
        this.alertMessage = newText;
        this.$nextTick(() => {
          this.restoreCursorPosition(range); // Restore cursor position
        });
      }
    },
    saveCursorPosition() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.$refs.textarea);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length; // Save as offset
      }
      return 0;
    },
    restoreCursorPosition(charOffset) {
      const range = document.createRange();
      range.setStart(this.$refs.textarea, 0);
      range.collapse(true);
      const treeWalker = document.createTreeWalker(
        this.$refs.textarea,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let currentNode, charCount = 0;
      while (treeWalker.nextNode()) {
        currentNode = treeWalker.currentNode;
        const length = currentNode.nodeValue.length;
        if (charOffset <= charCount + length) {
          range.setStart(currentNode, charOffset - charCount);
          range.collapse(true);
          break;
        }
        charCount += length;
      }
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },
    /*handlePdfError(error) {
      console.error('Error loading PDF:', error);
      alert('Greska prilikom ucitavanja PDF-a, pokusajte ponovo');
      // Handle error, e.g., display error message
    },*/

    downloadDoc() {
      try{
        const textValue = this.$refs.textarea.innerText;
        const lines = textValue.split('\n');
        const paragraph = new Paragraph({
            children: lines.flatMap((line, index) => [
                new TextRun(line),
                ...(index < lines.length - 1 ? [new TextRun({ text: '', break: 1 })] : [])
            ]),
        });

        const doc = new Document({
            sections: [{
                children: [paragraph],
            }],
        });

        const filenameWithoutExtension = this.file_name.replace(/\.pdf$/, '');

        Packer.toBlob(doc).then(blob => {
          saveAs(blob, filenameWithoutExtension + ".docx");
        })
      }
      catch{
        alert("Skidanje dokumenta neuspesno, ucitajte fajl ponovo");
      }

      /*Packer.toBlob(doc).then(blob => {
          saveAs(blob, filenameWithoutExtension + ".docx");
      }).catch(err => {
        alert("Skidanje dokumenta neuspesno, ucitajte fajl ponovo");
        console.error(err);
      });*/
    },

    editTextArea() {
      const editableDiv = this.$refs.textarea;
      if (editableDiv.getAttribute('contenteditable') === 'true') {
        editableDiv.setAttribute('contenteditable', 'false');
      } else {
        editableDiv.setAttribute('contenteditable', 'true');
      }
      this.$refs.textarea.focus();
    },
    clearFile() {
      if (this.pdfFile) {
        URL.revokeObjectURL(this.pdfFile); // Free up memory by revoking the URL
      }
      this.file = null;
      this.file_name = "";
      this.pdfFile = null;
      this.fileUploaded = false;
      this.is_bet = false;
      this.alertMessage = "";
      this.firstText = "";
      this.secondText = "";
      this.backActive = false;
      this.$refs.fileInput.value = '';
      this.$refs.textarea.setAttribute('readonly', 'readonly');
    },
    handleDrop(event) {
      event.preventDefault();
      this.isDragging = false;
      const item = event.dataTransfer.items[0].webkitGetAsEntry();
      this.traverseFileTree(item);
    },
    traverseFileTree(item) {
      if (item.isFile) {
        item.file(file => {
          this.file = file;
          this.pdfFile = URL.createObjectURL(file);
        });
      }
    },
    dragEnter(event) {
      event.preventDefault();
      this.isDragging = true;
    },
    dragLeave() {
      this.isDragging = false;
    },
    openFileExplorer() {
      this.$refs.fileInput.click();
    },
    handleFileInput(event) {
        const file = event.target.files[0];
        if (file.type !== 'application/pdf') {
          // Display an error message or take appropriate action for non-PDF files
          //console.error('Invalid file format. Only PDF files are allowed.');
          alert('Nevalidan format, samo je PDF dozvoljen.');
          return;
        }
        
        // Continue processing for PDF files
        this.file = file;
        const pdfUrl = URL.createObjectURL(file);
        this.pdfFile = pdfUrl;
      
        this.file_name = file.name.replace(/\.pdf$/, '');
    },
    async sendFileToFastAPI() {
      if (!this.file) return; // If no file selected, do nothing
      //console.log(this.selectedLanguage)
      this.isLoading = true; // Show loading indicator
      this.is_bet = false;
      this.firstText = "";
      this.secondText = "";
      this.backActive = false;

      const username = keycloak.tokenParsed.preferred_username;
      console.log(username)

      const formData = new FormData();
      formData.append('language_sent', this.selectedLanguage);
      formData.append('file', this.file);
      formData.append('username', username);
      
      try {
        const response = await axios.post(backend_path + '/upload/', formData);
        //const response = await axios.post('https://pocetna.test/api/upload/', formData);
        //const response = await axios.post('http://pocetna.test/api/upload/', formData);/*, {
        /*const response = await axios.post('http://localhost:8000/api/upload/', formData); /*, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }*/
        //console.log(response.data);
        const message = response.data.message;
        const is_bet = response.data.is_there_better;
        this.is_bet = is_bet;
        this.alertMessage = message;
        this.firstText = message;
        this.fileUploaded = true; // Set to true after successful upload

        if (response.data.highlighted_pdf) {
          // Decode the Base64 string to binary data
          const binaryString = window.atob(response.data.highlighted_pdf);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const pdfBlob = new Blob([bytes.buffer], { type: 'application/pdf' });

          // Create a URL for the Blob
          const pdfUrl = URL.createObjectURL(pdfBlob);

          // Update the pdfFile to the URL of the highlighted PDF
          this.pdfFile = pdfUrl;
        }

        //const highlighted_pdf = response.data.highlighted_pdf;
        //if(highlighted_pdf != null){
          //this.highlighted_pdf = highlighted_pdf;
          //this.pdfFile = highlighted_pdf;
          //this.pdfFile = URL.createObjectURL(highlighted_pdf);
        //}
      } catch (error) {
        //console.error(error);
        alert("Vas PDF nije validan, pokusajte ponovo");
      } finally {
        this.$refs.textarea.setAttribute('contenteditable', 'false');
        this.isLoading = false; // Hide loading indicator
      }
    },
    copyTextToClipboard() {
      if (this.alertMessage) {
        navigator.clipboard.writeText(this.alertMessage)
          .then(() => {
            console.log('Text copied to clipboard');
          })
          .catch((err) => {
            console.error('Unable to copy text to clipboard', err);
          });
      } else {
        console.error('No text available to copy');
      }
    },
    async secondUpload() {
      if(this.secondText.localeCompare("") != 0){
        this.alertMessage = this.secondText;
        this.backActive = true;
        return;
      }
      this.isLoading = true; // Show loading indicator
      //this.is_bet = false;

      const username = keycloak.tokenParsed.preferred_username;

      const formData = new FormData();
      formData.append('language_sent', this.selectedLanguage);
      formData.append('file', this.file);
    
      formData.append('username', username);

      try {
        //const response = await axios.post('http://pocetna.test/api/second_upload/', formData, {
        //const response = await axios.post('http://localhost:8000/api/second_upload/', formData, {
          //const response = await axios.post('https://localhost:8000/api/second_upload/', formData, {
        const response = await axios.post(backend_path + '/second_upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        //console.log(response.data);
        const message = response.data.message;
        this.alertMessage = message;
        this.secondText = message;
        this.backActive = true;
        this.fileUploaded = true; // Set to true after successful upload

        if (response.data.highlighted_pdf) {
          // Decode the Base64 string to binary data
          const binaryString = window.atob(response.data.highlighted_pdf);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const pdfBlob = new Blob([bytes.buffer], { type: 'application/pdf' });

          // Create a URL for the Blob
          const pdfUrl = URL.createObjectURL(pdfBlob);

          // Update the pdfFile to the URL of the highlighted PDF
          this.pdfFile = pdfUrl;
        }

      } catch (error) {
        alert("Vas PDF nije validan, pokusajte ponovo");
        //console.error(error);
      } finally {
        this.$refs.textarea.setAttribute('contenteditable', 'false');
        this.isLoading = false; // Hide loading indicator
      }
    },
    backToFirst() {
      this.alertMessage = this.firstText;
      this.backActive = false;
    },
  },
};