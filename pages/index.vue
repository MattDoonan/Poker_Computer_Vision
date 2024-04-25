<template>
  <section>
    <video ref="video" autoplay></video>
    <div class="container">
      <div class="row">
        <div class="col-lg-4 col-12">
          <h3 class="mt-5">
            {{ currentCards.length > 1 ? 'Current Hand' : (currentCards.length == 1 ? 'Need 2 cards' : 'Show Hand to start') }}
          </h3>
          <div class="show-cards">
            <NuxtImg :src="'/cards/' + card + '.png'" v-for="card in currentCards.slice(0, 2)"/>
          </div>
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
            {{ currentCards.length > 2 ? 'Shared cards' : '' }}
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
      handStrength: null,
      potentialHands: [],
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
      const savedCurrentCards = this.currentCards;
      const withoutHand = savedCurrentCards.slice(2);
      if (savedCurrentCards.length >= 2) {
        let ahead = 0;
        let tied = 0;
        let behind = 0;
        const ourRank = this.calcHandRanking(savedCurrentCards, true);
        const fullDeck = ['10C', '10D', '10H', '10S', '2C', '2D', '2H', '2S', '3C', '3D', '3H', '3S', '4C', '4D', '4H', '4S', '5C', '5D', '5H', '5S', '6C', '6D', '6H', '6S', '7C', '7D', '7H', '7S', '8C', '8D', '8H', '8S', '9C', '9D', '9H', '9S', 'AC', 'AD', 'AH', 'AS', 'JC', 'JD', 'JH', 'JS', 'KC', 'KD', 'KH', 'KS', 'QC', 'QD', 'QH', 'QS']
        for (let card of savedCurrentCards) {
          let indexToRemove = fullDeck.indexOf(card);
          fullDeck.splice(indexToRemove, 1);
        }
        const combinations: [string, string][] = [];
        for (let i = 0; i < fullDeck.length; i++) {
          for (let j = i + 1; j < fullDeck.length; j++) {
            combinations.push([fullDeck[i], fullDeck[j]]);
          }
        }
        for (let combination of combinations) {
          const possibility = withoutHand.concat(combination);
          const oppRank = this.calcHandRanking(possibility, false);
          if (ourRank > oppRank) {
            ahead++
          } else if (ourRank === oppRank) {
            tied++
          } else {
            behind++
          }
        }
        const value = ((ahead + tied / 2) / (ahead + tied + behind)) * 100
        console.log(ahead)
        console.log(tied)
        console.log(behind)
        console.log(value)
        console.log('')
        if (90 <= value) {
          this.handStrength = "Very Strong"
        } else if (80 <= value && value < 90) {
          this.handStrength = "Strong"
        } else if (70 <= value && value < 80) {
          this.handStrength = "Solid"
        } else if (60 <= value && value < 70) {
          this.handStrength = "Above average"
        } else if (40 <= value && value < 60) {
          this.handStrength = "Average"
        } else if (30 <= value && value < 40) {
          this.handStrength = "Below Average"
        } else if (20 <= value && value < 30) {
          this.handStrength = "Weak"
        } else if (10 <= value && value < 20) {
          this.handStrength = "Extremely Weak"
        } else if (0 <= value && value < 10) {
          this.handStrength = "Just Fold"
        }
      }
    },
    calcHandRanking(cards:string[], isOwnHand: boolean) {
      if (isOwnHand) {
        this.potentialHands = []
      }
      const pairVal = this.checkPairing(cards, isOwnHand);
      const straightFlushValue = this.checkStraightFlush(cards, isOwnHand);
      return Math.max(pairVal, straightFlushValue);
    },
    //Checks for any straights or flushes or both
    checkStraightFlush(cards:string[], isOwnHand: boolean) {
      let ordering = []
      const suiteCount: { [key: string]: number } = {'C': 0, 'S': 0, 'H': 0, 'D': 0};
      for (let card of cards) {
        const cardNum = this.getCardValue(card.substring(0, card.length - 1));
        const cardSuite = card.substring(card.length - 1);
        suiteCount[cardSuite]++
        ordering.push(cardNum);
      }
      ordering = ordering.sort((a, b) => a - b);
      let isFlush = null;
      let inARow = [];
      let potentialInARow = [];
      let skipped = 0
      for (let i = 1; i < ordering.length; i++) {
        if (ordering[i] === ordering[i - 1] + 1) {
          if (inARow.length === 0) {
            inARow.push(ordering[i - 1])
            inARow.push(ordering[i])
            potentialInARow.push(ordering[i - 1])
            potentialInARow.push(ordering[i])
          } else if (inARow.length >= 5) {
            inARow.splice(0, 1)
            inARow.push(ordering[i])
          } else  {
            inARow.push(ordering[i])
            potentialInARow.push(ordering[i])
          }
        } else if (ordering[i] !== ordering[i - 1]){
          inARow = [];
          let addedPot = false
          if (isOwnHand && cards.length > 4) {
            for (let y = 1; y <= (7 - cards.length - skipped); y++) {
              if (ordering[i] === ordering[i - 1] + 1 + y) {
                addedPot = true;
                skipped++;
                if (potentialInARow.length === 0) {
                  potentialInARow.push(ordering[i - 1]);
                  potentialInARow.push(ordering[i]);
                } else {
                  potentialInARow.push(ordering[i]);
                }
              }
              if (!addedPot && potentialInARow.length + 7 - cards.length < 5 ) {
                potentialInARow = [];
                skipped = 0;
                y = 1;
              }
            }
          }
        }
      }
      let hasAddedPotentialFlush = false
      for (let i of ['H', 'D', 'S', 'C']) {
        if (suiteCount[i] >= 5) {
          isFlush = i;
        } else if (7 - cards.length + suiteCount[i] >= 5 && isOwnHand && cards.length > 2 && !hasAddedPotentialFlush) {
          this.potentialHands.push("Flush")
          hasAddedPotentialFlush = true
        }
      }
      if (7 - cards.length + potentialInARow.length >= 5 && isOwnHand && cards.length > 2) {
        this.potentialHands.push("Straight")
      }
      if (inARow.length === 5 && isFlush) {
        let numInRow = 0
        for (let item of inARow) {
          for (let card of cards) {
            const cardNum = this.getCardValue(card.substring(0, card.length - 1));
            const cardSuite = card.substring(card.length - 1);
            if (cardNum === item && cardSuite === isFlush) {
              numInRow++
            }
          }
        }
        if (numInRow === 5) {
          if (JSON.stringify(inARow) === JSON.stringify([9, 10, 11, 12, 13])) {
            return 130;
          }
          return ordering[ordering.length - 1] + (13 * 8)
        }
      }
      if (isFlush) {
        return ordering[ordering.length - 1] + (13 * 5)
      } else if (inARow.length === 5) {
        return ordering[ordering.length - 1] + (13 * 4)
      }
      return 0
    },
    /* Checks for high card, pair, two pair, three of a kind, full house and four of a kind **/
    checkPairing(cards:string[], isOwnHand:boolean) {
      let maxCardInHand = 0
      const numCounts: { [key: number]: number } = {};
      for (let card of cards) {
        const cardNum = this.getCardValue(card.substring(0, card.length - 1));
        if (numCounts[cardNum]) {
          numCounts[cardNum]++;
        } else {
          numCounts[cardNum] = 1;
        }
        maxCardInHand = Math.max(cardNum, maxCardInHand)
      }
      let maxNumber = 1;
      let secondMax = 1;
      for (const num in numCounts) {
        if (numCounts[num] > maxNumber) {
          secondMax = maxNumber
          maxNumber = numCounts[num]
        } else if (numCounts[num] > secondMax) {
          secondMax = numCounts[num]
        }
      }
      if (maxNumber >= 4) {
        return maxCardInHand + (13 * 7)
      } else if (maxNumber >= 3 && secondMax >= 2) {
        return maxCardInHand + (13 * 6)
      } else if (maxNumber === 3) {
        if (7 - cards.length + 3 >= 4 && isOwnHand) {
          this.potentialHands.push("Four of a kind")
        }
        if (7 - cards.length + 3 >= 5 && isOwnHand) {
          this.potentialHands.push("Full House")
        }
        return maxCardInHand + (13 * 3)
      } else if (maxNumber === 2 && secondMax === 2) {
        return maxCardInHand + (13 * 2)
      } else if (maxNumber === 2) {
        if (7 - cards.length + 2 >= 3 && isOwnHand) {
          this.potentialHands.push("Three of a kind")
        }
        if (7 - cards.length + 2 >= 3 && isOwnHand) {
          this.potentialHands.push("Two pair")
        }
        return maxCardInHand + 13
      }
      return maxCardInHand
    },

    clearCurrentCards() {
      if (this.currentCards.length !== 0) {
        this.clearTimes = this.clearTimes + 1;
      } else {
        this.clearTimes = 0
      }
      if (this.clearTimes === 20) {
        this.currentCards = []
        this.handStrength = null
        this.potentialHands = []
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
