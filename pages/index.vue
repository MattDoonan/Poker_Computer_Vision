<template>
  <section>
    <video ref="video" autoplay></video>
    <div class="container">
      <div class="row">
        <div class="col-lg-4 col-12">
          <h3 class="mt-5">
            {{ currentCards.length > 1 ? 'Current Hand' : (currentCards.length == 1 ? 'Need 2 cards' : 'Draw two cards') }}
          </h3>
          <div class="show-cards">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in currentCards.slice(0, 2)"/>
          </div>
          <h4 class="mt-3 mb-1">
            {{ currentCards.length > 1 ? 'Chance of Winning: ' + chanceOfWinning.toFixed(2) + '%' : ''}}
          </h4>
          <h4>
            {{ currentCards.length > 1 ? 'Hand Ranking: ' + 0 + '/169': ''}}
          </h4>
          <h3 class="mt-4">
            {{ currentCards.length > 1 ? (currentCards.length <= 5 ? 'Show draw for predictions' : 'Draw') : '' }}
          </h3>
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
    }
  },
  mounted() {
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
        let ahead = 0;
        let tied = 0;
        let behind = 0;
        const ourRank = this.calcHandRanking(this.currentCards.slice(0, 2), this.currentCards.slice(2));
      }
    },
    calcHandRanking(ourCards:string[], bordCards:string[]) {
      const card1 = this.getCardValue(ourCards[0].substring(0, ourCards[0].length - 1));
      const card2 = this.getCardValue(ourCards[1].substring(0, ourCards[1].length - 1));
      const isSuited = ourCards[0].substring(1, 2) == ourCards[1].substring(1, 2);
      const pairVal = this.checkPairing(card1, card2, bordCards)
      console.log(pairVal)
    },

    /* Checks for high card, pair, two pair, three of a kind, full house and four of a kind **/
    checkPairing(card1:number, card2:number, bordCards:string[]) {
      const originalValue = Math.max(card1, card2)
      let similarToFirstCard = 0;
      let similarToSecondCard = 0;
      if (card1 == card2) {
        similarToFirstCard += 1
      }
      for (let card of bordCards) {
        const cardNum = this.getCardValue(card.substring(0, 1));
        if (cardNum == card1) {
          similarToFirstCard += 1
        } else if (cardNum == card2) {
          similarToSecondCard += 1
        }
      }
      if (similarToFirstCard === 4 || similarToSecondCard === 4) {
        return originalValue + (13 * 7)
      } else if ((similarToFirstCard === 3 && similarToSecondCard === 2) || (similarToFirstCard === 2 && similarToSecondCard === 3)) {
        return originalValue + (13 * 6)
      } else if (similarToFirstCard === 3 || similarToSecondCard === 3) {
        return originalValue + (13 * 3)
      } else if (similarToFirstCard === 2 && similarToSecondCard === 2) {
        return originalValue + (13 * 2)
      }
      return originalValue + 13
    },

    clearCurrentCards() {
      if (this.currentCards.length !== 0) {
        this.clearTimes = this.clearTimes + 1;
      } else {
        this.clearTimes = 0
      }
      if (this.clearTimes === 20) {
        this.currentCards = []
        this.chanceOfWinning = 0;
        this.cardTimes = 0
      }
    },
    checkSameList(list1:string[], list2:string[]) {
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
    },
    getCardValue(card:string) {
      if (card === '2') {
        return 1;
      }
      if (card === '3') {
        return 2;
      }
      if (card === '4') {
        return 3;
      }
      if (card === '5') {
        return 4;
      }
      if (card === '6') {
        return 5;
      }
      if (card === '7') {
        return 6;
      }
      if (card === '8') {
        return 7;
      }
      if (card === '9') {
        return 8;
      }
      if (card === '10') {
        return 9;
      }
      if (card === 'J') {
        return 10;
      }
      if (card === 'K') {
        return 11;
      }
      if (card === 'Q') {
        return 12;
      }
      return 13;

    }
  },
};
</script>
