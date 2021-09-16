<template>
  <div v-if="showFull">
    <form @submit.prevent="addConfiguredBrickToState" class="flex flex-col justify-center">
      <BuySell @emit-change="handleChangeSide"/>
      <div class="input-holder">
        <label for="market">Market</label>
        <input class="ml-1 flex-grow" type="text" id="market" v-model="payload.marketName">
      </div>
      <div class="input-holder">
        <label for="price">Price</label>
        <input class="ml-1 flex-grow" type="text" id="price" v-model="payload.price">
      </div>
      <div class="input-holder">
        <label for="size">Size</label>
        <input class="ml-1 flex-grow" type="text" id="size" v-model="payload.size">
      </div>
      <div class="flex flex-row justify-center align-middle">
        <label class="m-1" for="ioc">IOC</label>
        <input class="m-1" type="radio" name="Order Type" id="ioc" value="ioc" v-model="payload.orderType">
        <label class="m-1" for="ioc">Limit</label>
        <input class="m-1" type="radio" name="Order Type" id="limit" value="limit" v-model="payload.orderType">
        <label class="m-1" for="ioc">Post Only</label>
        <input class="m-1" type="radio" name="Order Type" id="postOnly" value="postOnly" v-model="payload.orderType">
      </div>
      <div class="pt-2">
        <Button size="small">DONE</Button>
      </div>
    </form>
  </div>

  <div v-else>
    <div v-if="payload.side === 'buy'">
      <p>{{ payload.orderType }} {{ payload.size * payload.price }} {{ quote }} --> {{ payload.size }} {{ base }}</p>
    </div>
    <div v-else>
      <p>{{ payload.orderType }} {{ payload.size }} {{ base }} --> {{ payload.size * payload.price }} {{ quote }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import { Method } from 'axios';
import BuySell from '@/common/components/BuySell.vue';
import { IDEXOrderFE } from '@/common/interfaces/dex/common.interfaces.dex.order';
import { addOrModifyConfiguredBrick } from '@/common/state';
import { getAction } from '@/common/protocols';
import Button from '@/common/components/primitive/Button.vue';

export default defineComponent({
  components: { BuySell, Button },
  props: {
    brick: {
      type: Object,
      required: true,
    },
    showFull: Boolean,
  },
  emits: ['end-edit'],
  setup(props, context) {
    const payload = reactive<IDEXOrderFE>({
      marketName: 'ATLAS/USDC',
      side: 'buy',
      price: parseFloat('0.2'),
      size: parseFloat('1'),
      orderType: 'ioc',
    });
    const base = ref<string>(payload.marketName.split('/')[0]);
    const quote = ref<string>(payload.marketName.split('/')[1]);

    const handleChangeSide = (newSide) => {
      payload.side = newSide;
    };

    const addConfiguredBrickToState = () => {
      addOrModifyConfiguredBrick({
        id: props.brick.id,
        method: getAction(props.brick.protocolId, props.brick.actionId).method as Method,
        path: getAction(props.brick.protocolId, props.brick.actionId).path,
        payload,
      });
      context.emit('end-edit');
    };

    return {
      payload,
      base,
      quote,
      handleChangeSide,
      addConfiguredBrickToState,
    };
  },
});
</script>

<style scoped>
.input-holder {
  @apply flex mt-1;
}
</style>
