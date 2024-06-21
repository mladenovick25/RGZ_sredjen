<template>
    <div class="file-selector container-fluid" style="font-family: Arial;">
      <div class="row" style="padding-top: 10px;">
        <div class="col-12 text-end">
          <button @click="downloadDoc" :disabled="!fileUploaded || isLoading" class="copy-button">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v12"></path>
                  <polyline points="9 15 12 18 15 15"></polyline>
                  <path d="M19 21H5"></path>
              </svg>
              као WORD
            </span>
          </button>
          <button @click="editTextArea" :disabled="!fileUploaded || isLoading" class="copy-button">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L10 16H7v-3L16.5 3.5z"></path>
              </svg>
              Уреди
            </span>
          </button>
          <button @click="copyTextToClipboard" :disabled="!fileUploaded || isLoading" class="copy-button">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Копирај
            </span>
            <!--<span v-if="isLoading">Копирање у току...</span>
            <span v-else>Копирај</span>-->
          </button>
        </div>
      </div>
      <div class="row">
        <!--<div class="middle-content col-sm-1"></div>-->
        <div class="middle-content col-sm-6">

          <div v-if="pdfFile" class="pdf-viewer">
            <embed :src="`${this.pdfFile}#zoom=${80}&rotate=${180}`" type="application/pdf" width="100%" style="height: 70vh;" />
          </div>

        </div>


        <div class="right-content col-sm-6" style="height: 70vh;">
          <!--<textarea ref="textarea" v-model="alertMessage" readonly class="alert-message" style="font-weight: bold;"></textarea>-->
          <div ref="textarea" v-html="formattedAlertMessage" readonly class="alert-message" style="text-align: left; font-weight: bold; white-space: pre-wrap; overflow-y: auto; height: 300px; padding: 8px;" @input="handleInput"></div>

        </div>
        <!-- Loading overlay -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-6 text-center">

          <div class="row">
            <div class=" col-sm-1" style="height: 20vh;" ></div>
            <div class=" col-sm-5" style="height: 20vh;" ref="leftContent">
              <div
                class="drop-area"
                @dragover.prevent
                @drop="handleDrop"
                @dragenter="dragEnter"
                @dragleave="dragLeave"
                :class="{ 'dragging': isDragging }"
                @click="openFileExplorer"
                style="height: 20vh;"
              >
                <p v-if="!file" class="drop-text" style="font-weight: bold;">Превуци фајл овде или кликни да би претражио...</p>
                <p v-else class="file-info" style="font-weight: bold;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M21 15v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7"></path>
                  </svg>
                  {{ file.name }}
                </p>
                <input
                  ref="fileInput"
                  type="file"
                  style="display: none"
                  @change="handleFileInput"
                />
              </div>
            </div>

            <div class="col-sm-6 text-center">

              <div class="row" style="max-height: 10vh;">
                <div class="col-sm-12 text-center">
                  <p style="font-weight: bold;"> Језик документа: </p>
                </div>
              </div>

              
              <div class="row">
                <div class="col-sm-12 text-center">
                  <div class="radio-buttons">
                    <label class="radio-label">
                      <input type="radio" v-model="selectedLanguage" value="srp" class="radio-input" :disabled="isLoading">
                      <span class="radio-custom"></span>
                      Српски
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="selectedLanguage" value="srp_latn" class="radio-input" :disabled="isLoading">
                      <span class="radio-custom"></span>
                      Srpski (Latinica)
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="selectedLanguage" value="eng" class="radio-input" :disabled="isLoading">
                      <span class="radio-custom"></span>
                      Engleski
                    </label>
                  </div>
                  <button @click="sendFileToFastAPI" :disabled="isLoading || !file" class="upload-button">
                    <span v-if="isLoading">Учитавање...</span>
                    <span v-else>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 19V6"></path>
                          <polyline points="5 12 12 5 19 12"></polyline>
                          <path d="M5 19h14"></path>
                      </svg>
                    Преведи фајл
                    </span>
                  </button>
                  <button @click="clearFile" class="upload-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 5L5 19M5 5l14 14"></path>
                    </svg>
                    Уклони фајл
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>


        <div class="col-sm-6 text-center">
          <div class="row" style="max-height: 10vh;">
            <div class="col-sm-12 text-center">
              <p v-if="(is_bet && !backActive) || (!is_bet && backActive)" style="font-weight: bold;"><br>*Ако нисте задовољни овим транскриптом кликните на дугме испод.</p>
              <p v-else style="font-weight: bold;"> <br><br><br> </p>
            </div>
          </div>

          
          <div class="row">
            <div class="col-sm-12 text-center">
              <button v-if="((is_bet && !backActive) || (!is_bet && backActive)) && !isLoading" @click="secondUpload" class="copy-button">Други начин</button>
              <button v-if="!isLoading && backActive" @click="backToFirst" class="copy-button" style="min-width: 200px;">Врати се назад</button>
            </div>
          </div>
        </div>

       
      </div>
    </div>
</template>

<script>
import fileSelectorFunctions from './fileSelectorFunctions';

export default {
  ...fileSelectorFunctions,
};

</script>

<style scoped>

@import './file-selector-styles.css';

</style>
