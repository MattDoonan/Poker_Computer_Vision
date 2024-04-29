<template>
  <section>
    <video ref="video" autoplay></video>
    <div class="container">
      <div class="row">
        <div class="col-lg-4 col-12">
          <h3 class="mt-5">
            {{ playersHand.length > 1 ? 'Current Hand' : (playersHand.length == 1 ? 'Need 2 cards' : 'Show Hand to start') }}
          </h3>
          <div class="show-cards" v-if="playersHand.length > 0">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in playersHand"/>
          </div>
          <button @click="toggleSaveHand" class="mt-3" v-if="playersHand.length == 2">
            {{!savedPlayersCards ? 'Save hand' : 'Clear hand'}}
          </button>
          <h4 v-if="handStrength" class="mt-3 mb-1">
            {{ 'Current hand strength: ' + handStrength}}
          </h4>
          <h4 v-if="potentialHands.length > 0" class="mt-2 mb-1">
            Potential hands:
          </h4>
          <h5 v-for="pot in potentialHands" >
            {{pot}}
          </h5>
          <h3 class="mt-4">
            {{ sharedCards.length > 0 ? 'Shared cards' : '' }}
          </h3>
          <div class="show-cards">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in sharedCards"/>
          </div>
          <button @click="toggleSaveSharedCards" class="mt-3" v-if="sharedCards.length >= 3">
            {{!savedSharedCards ? 'Save shared cards' : 'Clear shared cards'}}
          </button>
        </div>
        <div class="col-6">
        </div>
      </div>
    </div>
    <canvas ref="canvas" style="display: none;"></canvas>
  </section>
</template>

<script setup lang="ts">
</script>

<script lang="ts">


import axios from "axios";

const API_URL = 'http://127.0.0.1:5000';

export default {
  data() {
    return {
      playersHand: [] as string[],
      sharedCards: [] as string[],
      savedPlayersCards: false,
      savedSharedCards: false,
      clearTimes: 0,
      cardTimes: 0,
      previousList: [],
      handStrength: null,
      potentialHands: [],
    }
  },
  mounted() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(async stream => {
          this.$refs.video.srcObject = stream;
          this.$refs.video.addEventListener('playing', () => {
            setInterval( () => {
              const canvas = document.createElement('canvas');
              canvas.width = this.$refs.video.videoWidth;
              canvas.height = this.$refs.video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpg');
                this.updateImage(imageData);
              }
            }, 1000);
          });
        })
        .catch(err => {
          console.error('Error accessing webcam:', err);
        });
  },
  methods: {
    async updateImage(imageData:string) {
      const copyPlayersHand: string[] = []
      const copySharedCards: string[] = []
      for (let i of this.playersHand) {
        copyPlayersHand.push(i)
      }
      for (let i of this.sharedCards) {
        copySharedCards.push(i)
      }
      const requestData = {
        image: imageData,
        playersHand: copyPlayersHand,
        sharedCards: copySharedCards,
        savedPlayersCards: this.savedPlayersCards,
        savedSharedCards: this.savedSharedCards,
      };
      try {
        const response = await axios.post(`${API_URL}/get_card_data`, requestData);
        console.log(response.data)
        const data = response.data
        this.playersHand = data.playersHand.sort()
        this.sharedCards = data.sharedCards.sort()
        this.handStrength = data.handStrength
        this.potentialHands = data.potentialHands
      } catch (error) {
        console.error('Error fetching card data: ', error);
      }
    },
    toggleSaveHand() {
      this.savedPlayersCards = !this.savedPlayersCards;
    },
    toggleSaveSharedCards() {
      this.savedSharedCards = !this.savedSharedCards;
    }
  },
};
</script>
