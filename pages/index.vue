<template>
  <section>
    <video ref="video" autoplay></video>
    <div class="container">
      <div class="row">
        <div class="col-4">
          <h4>
            {{ currentCards.length > 1 ? 'Current Hand' : (currentCards.length == 1 ? 'Need 2 cards' : 'Draw two cards') }}
          </h4>
          <div class="show-cards">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in currentCards.slice(0, 2)"/>
          </div>
          <h4>
            {{ currentCards.length > 1 ? 'Chance of Winning: ' + chanceOfWinning.toFixed(2) + '%' : ''}}
          </h4>
          <h4>
            {{ currentCards.length > 1 ? 'Hand Ranking: ' + handRanking + '/169': ''}}
          </h4>
          <h4>
            {{ currentCards.length > 1 ? (currentCards.length <= 5 ? 'Show draw for predictions' : 'Draw') : '' }}
          </h4>
          <div class="show-cards">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in currentCards.slice(2, 7)"/>
          </div>
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
import {type hand, possibleHands} from 'assets/typescript/handRakings'

export default {
  data() {
    return {
      currentCards: [],
      clearTimes: 0,
      cardTimes: 0,
      previousList: [],
      chanceOfWinning: 0,
      handRanking: 169,
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
    const captureInterval = setInterval(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.$refs.video.videoWidth;
      canvas.height = this.$refs.video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpg');
        try {
          const response = await axios({
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
          const data = response.data.predictions;
          if (data.length === 0) {
            this.clearCurrentCards();
          } else {
            const cards: string[] = [];
            for (let card of data) {
              if (!cards.includes(card.class)) {
                cards.push(card.class);
              }
            }
            this.updateCurrentCards(cards)
          }
        } catch (error: any) {
          console.log(error.message);
        }
      }
    }, 100);
  },
  methods: {
    showHandRanking() {
      if (this.currentCards.length >= 2) {
        const card1 = this.currentCards[0].substring(0, 1);
        const card2 = this.currentCards[1].substring(0, 1);
        const isSuited = this.currentCards[0].substring(1, 2) == this.currentCards[1].substring(1, 2)
        for (let rank of possibleHands) {
          if (
              (card1 === rank.numbers[0] && card2 === rank.numbers[1]) ||
              (card1 === rank.numbers[1] && card2 === rank.numbers[0])
          ) {
            if (rank.suited && isSuited) {
              this.chanceOfWinning = rank.percentage;
              this.handRanking = rank.rank;
              return
            } else if (!rank.suited) {
              this.chanceOfWinning = rank.percentage;
              this.handRanking = rank.rank;
              return;
            }
          }
        }
      }
    },
    clearCurrentCards() {
      console.log("hello")
      if (this.currentCards.length !== 0) {
        this.clearTimes = this.clearTimes + 1;
      } else {
        this.clearTimes = 0
      }
      if (this.clearTimes === 20) {
        this.currentCards = []
        this.chanceOfWinning = 0;
        this.handRanking = 169;
        this.cardTimes = 0
      }
    },
    checkSameList(list1:string[], list2:string[]) {
      console.log("same")
      if (list1.length !== list2.length) {
        return false;
      }
      for (let i = 0; i < list1.length; i++) {
        if (list1[i] !== list2[i]) {
          return false;
        }
      }
      return true;
    },
    updateCurrentCards(cards:string[]) {
      const sortedCards = cards.sort();
      this.clearTimes = 0
      if (this.currentCards.length === 0) {
        this.cardTimes = 0
        this.currentCards = sortedCards
        this.showHandRanking()
      } else {
        if (this.checkSameList(this.currentCards, sortedCards)) {
          this.cardTimes = 0
        } else if (this.checkSameList(this.previousList, sortedCards)) {
          this.cardTimes = this.cardTimes + 1
        } else  {
          this.cardTimes = 0
          this.previousList = sortedCards;
        }
      }
      if (this.cardTimes >= 3) {
        this.currentCards = this.previousList
        this.showHandRanking()
      }
    }
  },
};
</script>
