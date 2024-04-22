<template>
  <section>
    <video ref="video" autoplay></video>
    <canvas ref="canvas" style="display: none;"></canvas>
  </section>
</template>

<script setup lang="ts">
import axios from "axios"; // Import Axios
import fs from "fs"; // Import fs

</script>

<script lang="ts">


import axios from "axios"; // Import Axios

export default {
  data() {
    return {
      currentImg: null,
    }
  },
  mounted() {
    // Access webcam stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          this.$refs.video.srcObject = stream;
        })
        .catch(err => {
          console.error('Error accessing webcam:', err);
        });
    const captureInterval = setInterval(() => {
      const canvas = document.createElement('canvas');
      canvas.width = this.$refs.video.videoWidth;
      canvas.height = this.$refs.video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpg');

        // Make Axios request
        axios({
          method: "POST",
          url: "https://detect.roboflow.com/playing-cards-ow27d/4",
          params: {
            api_key: "cCUXoekH1Wr2R3DEbB4W"
          },
          data: imageData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        })
            .then(function(response) {
              console.log(response.data);
            })
            .catch(function(error) {
              console.log(error.message);
            });
      }
    }, 1000);
  }
};
</script>
