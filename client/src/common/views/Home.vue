<template>
  <div class="home flex flex-col items-center pt-20">
    <transition name="send">
      <SkewedButton v-if="bricks.length > 0" @click="sendTx" text="BUILD + SEND"/>
      <div v-else style="height: 60px"></div>
    </transition>

    <a href="#" @click="openNewBrickModal" :class="{hiddenz: stateCollapsed}">
      <svg class="pulse_small mt-10" id="svg1" width="150" height="150" viewBox="0 0 452 428" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M450 298V134L392 100.785V96.5C392 80.7599 369.167 68 341 68C338.798 68 336.629 68.078 334.5 68.2293L277 35.5V30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5V35L117 68.1952C115.032 68.0663 113.03 68 111 68C82.8335 68 60 80.7599 60 96.5V100L2 134V298L226 425.5L450 298ZM249.5 156H202.5V190.5H168V237.5H202.5V272H249.5V237.5H284V190.5H249.5V156Z" fill="black"/>
        <path d="M450 134V298L226 425.5M450 134L392 100.785M450 134L284 228.487M392 100.785V96.5M392 100.785V131.5C392 147.24 369.167 160 341 160C312.833 160 290 147.24 290 131.5V96.5M392 100.785L391.502 100.5M392 96.5C392 80.7599 369.167 68 341 68C338.798 68 336.629 68.078 334.5 68.2293M392 96.5C392 97.8576 391.83 99.193 391.502 100.5M334.5 68.2293L277 35.5M334.5 68.2293C309.403 70.0133 290 81.9904 290 96.5M277 35.5V30.5M277 35.5V65.5C277 81.2401 254.167 94 226 94C197.833 94 175 81.2401 175 65.5V35M277 30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5M277 30.5C277 46.2401 254.167 59 226 59C197.833 59 175 46.2401 175 30.5M175 30.5V35M175 35L117 68.1952M117 68.1952C115.032 68.0663 113.03 68 111 68C82.8335 68 60 80.7599 60 96.5M117 68.1952C142.339 69.8546 162 81.8942 162 96.5M60 96.5V100M60 96.5C60 112.24 82.8335 125 111 125C139.167 125 162 112.24 162 96.5M60 100L2 134M60 100V131.5C60 147.24 82.8335 160 111 160C139.167 160 162 147.24 162 131.5V96.5M2 134V298L226 425.5M2 134L168 228.487M226 425.5V272M183.835 237.5L202.5 248.124M268.165 237.5L249.5 248.124M277 160.5C277 171.504 265.84 181.051 249.5 185.801M277 160.5C277 144.76 254.167 132 226 132C197.833 132 175 144.76 175 160.5M277 160.5V190.5M202.5 185.801C186.16 181.051 175 171.504 175 160.5M175 160.5V190.5M391.502 100.5C388.022 114.346 366.737 125 341 125C312.833 125 290 112.24 290 96.5M202.5 156H249.5V190.5H284V237.5H249.5V272H202.5V237.5H168V190.5H202.5V156Z" stroke="black" stroke-width="4"/>
      </svg>
    </a>

    <div id="brickHolder" class="flex flex-col items-center" :class="{pulse: stateCollapsed}">
      <transition-group name="list">
        <div
          v-for="brick in bricks" :key="brick.id"
          class="flex flex-row justify-center align-middle dbrick-div"
          :class="[{collapse: stateCollapsed}, {'standard-height': configuredBricks.indexOf(brick.id) >= 0}]"
        >
          <div class="space-filler"></div>
          <svg
            class="dbrick mx-20"
            :class="[{highlight: configuredBricks.indexOf(brick.id) === -1}, {'hover-highlight': !stateCollapsed}]"
            :style="{'z-index':brick.id}"
            :fill="brick.fill"
            viewBox="0 0 452 428" xmlns="http://www.w3.org/2000/svg">
            <path d="M450 134V298L226 425.5L2 298V134L60 100V96.5C60 80.7599 82.8335 68 111 68C113.03 68 115.032 68.0663 117 68.1952L175 35V30.5C175 14.7599 197.833 2 226 2C254.167 2 277 14.7599 277 30.5V35.5L334.5 68.2293C336.629 68.078 338.798 68 341 68C369.167 68 392 80.7599 392 96.5V100.785L450 134Z"/>
            <path d="M2 134L226 261.5M2 134V298L226 425.5M2 134L60 100M226 261.5V425.5M226 261.5L450 134M226 425.5L450 298V134M450 134L391.502 100.5M277 35.5L334.5 68.2293M277 160.5C277 176.24 254.167 189 226 189C197.833 189 175 176.24 175 160.5M277 160.5C277 144.76 254.167 132 226 132C197.833 132 175 144.76 175 160.5M277 160.5V195.5C277 211.24 254.167 224 226 224C197.833 224 175 211.24 175 195.5V160.5M162 96.5C162 112.24 139.167 125 111 125C82.8335 125 60 112.24 60 96.5M162 96.5C162 80.7599 139.167 68 111 68C82.8335 68 60 80.7599 60 96.5M162 96.5V131.5C162 147.24 139.167 160 111 160C82.8335 160 60 147.24 60 131.5V96.5M392 96.5C392 112.24 369.167 125 341 125C312.833 125 290 112.24 290 96.5M392 96.5C392 80.7599 369.167 68 341 68C312.833 68 290 80.7599 290 96.5M392 96.5V131.5C392 147.24 369.167 160 341 160C312.833 160 290 147.24 290 131.5V96.5M277 30.5C277 46.2401 254.167 59 226 59C197.833 59 175 46.2401 175 30.5M277 30.5C277 14.7599 254.167 2 226 2C197.833 2 175 14.7599 175 30.5M277 30.5V65.5C277 81.2401 254.167 94 226 94C197.833 94 175 81.2401 175 65.5V30.5M117 68.1952L175 35"/>
          </svg>
          <div class="space-filler">
            <BrickConfig
              v-if="!stateCollapsed"
              class="brick-config"
              :class="{'forced-1opacity': configuredBricks.indexOf(brick.id) === -1}"
              :brick="brick"
              @start-edit="handleStartEdit"
              @end-edit="handleEndEdit"
              @remove-brick="handleRemoveBrick"
            >
            </BrickConfig>
          </div>
        </div>
      </transition-group>
    </div>

    <svg id="shadow" width="250" height="250" viewBox="0 0 458 261" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M229 258.5L5 131L229 2.5L453 131L229 258.5Z" stroke="black" stroke-width="4"/>
    </svg>

    <AddBrick v-if="stateModalActive" @cancel-modal="handleCancelModal" @new-brick="handleNewBrick"/>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import SkewedButton from '@/common/components/primitive/SkewedButton.vue';
import AddBrick from '@/common/views/AddBrick.vue';
import BrickConfig from '@/common/components/BrickConfig.vue';
import { getProtocol } from '@/common/protocols';
import { executeTx, prepareTxs } from '@/common/state';

// interface IRequest {
//   method: string,
//   path: string,
//   payload?: any,
// }

interface IBrick {
  id: number,
  fill: string,
  protocolId: number,
  actionId: number,
  // request?: IRequest,
}

export default defineComponent({
  components: {
    BrickConfig,
    AddBrick,
    SkewedButton,
  },
  setup() {
    const stateCollapsed = ref(false);
    const stateModalActive = ref(false);

    const bricks = ref<IBrick[]>([]);
    const configuredBricks = ref<number[]>([]);

    const openNewBrickModal = () => {
      stateModalActive.value = true;
    };
    const sendTx = async () => {
      bricks.value.forEach(() => {
        // this makes sure all configs are closed
        configuredBricks.value = bricks.value.map((b) => b.id);
      });
      stateCollapsed.value = true;
      const [ixs, signers] = await prepareTxs();
      await executeTx(ixs, signers);
    };
    const handleCancelModal = () => {
      stateModalActive.value = false;
    };
    const handleNewBrick = (newBrick) => {
      stateModalActive.value = false;
      bricks.value.unshift({
        id: bricks.value.length ? bricks.value[0].id + 1 : 0,
        fill: getProtocol(newBrick.protocolId).color,
        protocolId: newBrick.protocolId,
        actionId: newBrick.actionId,
      });
    };
    const handleStartEdit = (brick) => {
      const i = configuredBricks.value.indexOf(brick.brickId);
      if (i >= 0) {
        configuredBricks.value.splice(i, 1);
      }
    };
    const handleEndEdit = (brick) => {
      const i = configuredBricks.value.indexOf(brick.brickId);
      if (i === -1) {
        configuredBricks.value.push(brick.brickId);
      }
    };
    const handleRemoveBrick = (brick) => {
      const i = bricks.value.indexOf(brick.brickId);
      bricks.value.splice(i, 1);
      handleStartEdit(brick); // this will remove from the other list too
    };

    return {
      bricks,
      configuredBricks,
      stateCollapsed,
      stateModalActive,
      openNewBrickModal,
      sendTx,
      handleCancelModal,
      handleNewBrick,
      handleStartEdit,
      handleEndEdit,
      handleRemoveBrick,
    };
  },
});
</script>

<style>

svg {
  stroke: black;
  stroke-width: 5px;
  transition: all .2s ease-in-out;
  position: relative;
}

.hiddenz {
  opacity: 0;
  transition: 0.3s;
}

#shadow {
  filter: blur(30px);
  opacity: 0.5;
  z-index: 0;
  position: relative;
}

/* ---------- bricks list ---------- */

.list-enter-from {
  max-height: 0 !important;
}

/*important to use max-height, not height*/
.list-enter-to {
  /*set this way higher than expected value*/
  max-height: 999px !important;
}

.list-enter-active {
  /*todo https://forum.vuejs.org/t/list-transitions-first-elements-content-showing-up-too-fast/121643*/
  /*in the meantime keep this fast enough to not notice*/
  transition: all .5s ease-in-out;
}

/*without this one the div won't collapse back to 150px after done editing*/
.standard-height {
  height: 150px !important;
}

.dbrick-div {
  margin: 10px;
}

.dbrick-div:hover .hover-highlight {
  filter: drop-shadow(0px 0px 20px ghostwhite);
}

.dbrick {
  height: inherit;
  max-height: 150px;
  width: 150px;
}

.highlight {
  filter: drop-shadow(0px 0px 20px ghostwhite);
}

.space-filler {
  width: 400px;
}

/* ---------- config opacity ---------- */

.dbrick-div:hover .brick-config {
  opacity: 1;
}

.brick-config {
  opacity: 0.4;
  /*transition: all .5s ease-in-out;*/
}

.forced-1opacity {
  opacity: 1 !important;
}

/* ---------- send button ---------- */

.send-enter-from {
  opacity: 0;
}

.send-enter-to {
  opacity: 1;
}

.send-enter-active {
  transition: all 1s linear;
}

.collapse {
  margin: -48px !important;
  transition: 1s cubic-bezier(1, -0.35, .94, -0.01);
}

/* ---------- animations ---------- */

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

/*todo for some reason looks a little staggered*/
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

</style>
