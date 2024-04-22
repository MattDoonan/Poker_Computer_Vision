<script setup lang="ts">
</script>

<template>
  <section>
    <video ref="video" autoplay></video>
    <canvas ref="canvas" style="display: none;"></canvas>
  </section>
</template>

<script lang="ts">
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
        ctx.drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height); // Corrected line
        const imageData = canvas.toDataURL('image/jpg');
        const axios = require("axios");
        const fs = require("fs");

        const image = fs.readFileSync("YOUR_IMAGE.jpg", {
          encoding: "base64"
        });

        axios({
          method: "POST",
          url: "https://detect.roboflow.com/playing-cards-ow27d/4",
          params: {
            api_key: "cCUXoekH1Wr2R3DEbB4W"
          },
          data: image,
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
