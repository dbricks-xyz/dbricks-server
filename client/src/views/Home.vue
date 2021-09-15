<template>
  <div class="home flex flex-col items-center pt-40">
    <transition name="send">
      <SkewedButton v-if="bricks.length > 0" @click="sendTx">BUILD + SEND</SkewedButton>
      <div v-else style="height: 60px"></div>
    </transition>

    <a href="#" @click="openConfig" :class="{hiddenz: stateCollapsed}">
      <svg class="pulse_small highlight mt-10" id="svg1" width="150" height="150" viewBox="0 0 452 428" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M450 298V134L392 100.785V96.5C392 80.7599 369.167 68 341 68C338.798 68 336.629 68.078 334.5 68.2293L277 35.5V30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5V35L117 68.1952C115.032 68.0663 113.03 68 111 68C82.8335 68 60 80.7599 60 96.5V100L2 134V298L226 425.5L450 298ZM249.5 156H202.5V190.5H168V237.5H202.5V272H249.5V237.5H284V190.5H249.5V156Z" fill="black"/>
        <path d="M450 134V298L226 425.5M450 134L392 100.785M450 134L284 228.487M392 100.785V96.5M392 100.785V131.5C392 147.24 369.167 160 341 160C312.833 160 290 147.24 290 131.5V96.5M392 100.785L391.502 100.5M392 96.5C392 80.7599 369.167 68 341 68C338.798 68 336.629 68.078 334.5 68.2293M392 96.5C392 97.8576 391.83 99.193 391.502 100.5M334.5 68.2293L277 35.5M334.5 68.2293C309.403 70.0133 290 81.9904 290 96.5M277 35.5V30.5M277 35.5V65.5C277 81.2401 254.167 94 226 94C197.833 94 175 81.2401 175 65.5V35M277 30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5M277 30.5C277 46.2401 254.167 59 226 59C197.833 59 175 46.2401 175 30.5M175 30.5V35M175 35L117 68.1952M117 68.1952C115.032 68.0663 113.03 68 111 68C82.8335 68 60 80.7599 60 96.5M117 68.1952C142.339 69.8546 162 81.8942 162 96.5M60 96.5V100M60 96.5C60 112.24 82.8335 125 111 125C139.167 125 162 112.24 162 96.5M60 100L2 134M60 100V131.5C60 147.24 82.8335 160 111 160C139.167 160 162 147.24 162 131.5V96.5M2 134V298L226 425.5M2 134L168 228.487M226 425.5V272M183.835 237.5L202.5 248.124M268.165 237.5L249.5 248.124M277 160.5C277 171.504 265.84 181.051 249.5 185.801M277 160.5C277 144.76 254.167 132 226 132C197.833 132 175 144.76 175 160.5M277 160.5V190.5M202.5 185.801C186.16 181.051 175 171.504 175 160.5M175 160.5V190.5M391.502 100.5C388.022 114.346 366.737 125 341 125C312.833 125 290 112.24 290 96.5M202.5 156H249.5V190.5H284V237.5H249.5V272H202.5V237.5H168V190.5H202.5V156Z" stroke="black" stroke-width="4"/>
      </svg>
    </a>

    <div id="brickHolder" class="flex flex-col items-center" :class="{pulse: stateCollapsed}">
      <transition-group name="list">
        <svg
          v-for="brick in bricks" :key="brick.id"
          class="highlight" :class="{collapse: stateCollapsed}"
          :style="{'z-index':brick.id}"
          :fill="brick.fill"
          width="150" height="150" viewBox="0 0 452 428" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M450 134V298L226 425.5L2 298V134L60 100V96.5C60 80.7599 82.8335 68 111 68C113.03 68 115.032 68.0663 117 68.1952L175 35V30.5C175 14.7599 197.833 2 226 2C254.167 2 277 14.7599 277 30.5V35.5L334.5 68.2293C336.629 68.078 338.798 68 341 68C369.167 68 392 80.7599 392 96.5V100.785L450 134Z"/>
          <path d="M2 134L226 261.5M2 134V298L226 425.5M2 134L60 100M226 261.5V425.5M226 261.5L450 134M226 425.5L450 298V134M450 134L391.502 100.5M277 35.5L334.5 68.2293M277 160.5C277 176.24 254.167 189 226 189C197.833 189 175 176.24 175 160.5M277 160.5C277 144.76 254.167 132 226 132C197.833 132 175 144.76 175 160.5M277 160.5V195.5C277 211.24 254.167 224 226 224C197.833 224 175 211.24 175 195.5V160.5M162 96.5C162 112.24 139.167 125 111 125C82.8335 125 60 112.24 60 96.5M162 96.5C162 80.7599 139.167 68 111 68C82.8335 68 60 80.7599 60 96.5M162 96.5V131.5C162 147.24 139.167 160 111 160C82.8335 160 60 147.24 60 131.5V96.5M392 96.5C392 112.24 369.167 125 341 125C312.833 125 290 112.24 290 96.5M392 96.5C392 80.7599 369.167 68 341 68C312.833 68 290 80.7599 290 96.5M392 96.5V131.5C392 147.24 369.167 160 341 160C312.833 160 290 147.24 290 131.5V96.5M277 30.5C277 46.2401 254.167 59 226 59C197.833 59 175 46.2401 175 30.5M277 30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5M277 30.5V65.5C277 81.2401 254.167 94 226 94C197.833 94 175 81.2401 175 65.5V30.5M117 68.1952L175 35"/>
        </svg>
      </transition-group>
    </div>

    <svg id="shadow" width="250" height="250" viewBox="0 0 458 261" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M229 258.5L5 131L229 2.5L453 131L229 258.5Z" stroke="black" stroke-width="4"/>
    </svg>

    <Modal v-if="stateModalActive" @cancel-modal="handleCancelModal">
      <div class="flex flex-col items-center">
        <p class="text-white">Choose the protocol (eg serum)</p>
        <p class="text-white">Choose the service (eg place order)</p>
        <p class="text-white">Configure it</p>
        <p class="text-white">Configure it</p>
        <p class="text-white">Configure it</p>
        <p class="text-white">Configure it</p>
        <p class="text-white">Hit add when happy</p>
        <button class="m-4 p-4 w-40 text-xl text-center btn" @click="addBrick">
          ADD
        </button>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Modal from '@/components/Modal.vue';
import Button from '@/components/Button.vue';
import SkewedButton from '@/components/SkewedButton.vue';

interface IBrick {
  id: number,
  fill: string,
}

export default defineComponent({
  components: { SkewedButton, Button, Modal },
  setup() {
    const bricks = ref<IBrick[]>([]);
    const colorChoices = ['#FF0000', '#0EECDD', '#FFF339', '#3F00FF', '#F98505', '#F038A5'];
    const stateCollapsed = ref(false);
    const stateModalActive = ref(false);

    const openConfig = () => {
      stateModalActive.value = true;
    };
    const addBrick = () => {
      stateModalActive.value = false;
      bricks.value.unshift({
        id: bricks.value.length,
        fill: colorChoices[getRandomInt(6)],
      });
    };
    const getRandomInt = (max: number) => Math.floor(Math.random() * max);
    const sendTx = () => {
      stateCollapsed.value = true;
    };
    const handleCancelModal = () => {
      stateModalActive.value = false;
    };

    return {
      bricks,
      colorChoices,
      stateCollapsed,
      stateModalActive,
      openConfig,
      addBrick,
      getRandomInt,
      sendTx,
      handleCancelModal,
    };
  },
});
</script>

<style>
/* // --------------------------------------- Svgs */

.send-enter-from {
  opacity: 0;
}

.send-enter-to {
  opacity: 1;
}

.send-enter-active {
  transition: all 1s linear;
}

.list-enter-from {
  height: 0 !important;
}

.list-enter-to {
  height: 150px !important;
}

@keyframes pulse_large {
  0% {
    filter: drop-shadow(0px 0px 20px ghostwhite);
  }

  20% {
    filter: drop-shadow(0px 0px 60px ghostwhite) drop-shadow(0px 0px 5px theme('colors.db.pink'));
  }

  40% {
    filter: drop-shadow(0px 0px 20px ghostwhite);
  }

  60% {
    filter: drop-shadow(0px 0px 60px ghostwhite) drop-shadow(0px 0px 5px theme('colors.db.cyan'));
  }

  80% {
    filter: drop-shadow(0px 0px 20px ghostwhite);
  }

  100% {
    filter: drop-shadow(0px 0px 60px ghostwhite) drop-shadow(0px 0px 5px theme('colors.db.yellow'));
  }
}

@keyframes pulse_small {
  0% {
    filter: drop-shadow(0px 0px 10px ghostwhite);
  }

  100% {
    filter: drop-shadow(0px 0px 20px ghostwhite);
  }
}

svg {
  stroke: black;
  stroke-width: 5px;
  transition: all .2s ease-in-out;
  position: relative;
}

.collapse {
  margin: -48px;
  transition: 1s cubic-bezier(1, -0.35, .94, -0.01);
}

.pulse_small {
  filter: drop-shadow(0px 0px 10px ghostwhite);
  animation-name: pulse_small;
  animation-duration: 1s;
  animation-direction: alternate;
  animation-iteration-count: infinite;
  animation-delay: 1s;
}

.pulse {
  animation-name: pulse_large;
  animation-duration: 6s;
  animation-direction: alternate;
  animation-iteration-count: infinite;
  animation-delay: 1s;
}

.hiddenz {
  opacity: 0;
  transition: 0.3s;
}

.highlight:hover {
  stroke: black;
  filter: drop-shadow(0px 0px 20px ghostwhite);
}

#shadow {
  filter: blur(30px);
  opacity: 0.5;
  z-index: 0;
  position: relative;
}

.btn {
  background-color: theme('colors.db.cyan');
  font-family: 'superman', sans-serif;
}

</style>
