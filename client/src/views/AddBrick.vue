<template>
  <Modal>
    <p>Pick a protocol:</p>
    <div class="flex flex-row justify-between">
      <SelectableBox
        v-for="p in protocols" :key="p.id"
        class="flex-1"
        :color="p.color"
        :selected="selectedProtocolId === p.id"
        @click="selectedProtocolId = p.id"
      >
        <div class="flex flex-col items-center align-middle p-2">
          <ProtocolLogo :size="50" :protocol-id="p.id"/>
          <p class="mt-3">{{ p.name }}</p>
        </div>
      </SelectableBox>
    </div>

    <p class="mt-10">Pick an action:</p>
    <SelectableBox
      v-for="a in protocols[selectedProtocolId].actions" :key="a.id"
      class="flex-1"
      :color="protocols[selectedProtocolId].color"
      :selected="selectedActionId === a.id"
      @click="selectedActionId = a.id"
    >
      <p>{{ a.name }}</p>
    </SelectableBox>

    <div class="flex flex-col items-center w-full">
      <Button size="med" @click="emitNewBrick">ADD</Button>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import Modal from '@/components/Modal.vue';
import Button from '@/components/Button.vue';
import SelectableBox from '@/components/SelectableBox.vue';
import ProtocolLogo from '@/components/ProtocolLogo.vue';
import tailwindConfig from '../../tailwind.config.js';

interface IAction {
  id: number,
  name: string,
}

interface IProtocol {
  id: number,
  name: string,
  color: string,
  logo: string,
  actions: IAction[]
}

export default defineComponent({
  components: {
    ProtocolLogo,
    SelectableBox,
    Button,
    Modal,
  },
  emits: ['new-brick'],
  setup(props, context) {
    const fullConfig = resolveConfig(tailwindConfig);
    const protocols = ref<IProtocol[]>([
      {
        id: 0,
        name: 'Serum',
        color: fullConfig.theme.colors.db.serum,
        logo: '@/assets/protocols/serumlogo.svg',
        actions: [
          { id: 0, name: 'Initialize market' },
          { id: 1, name: 'Place order' },
          { id: 2, name: 'Cancel order' },
          { id: 3, name: 'Settle funds' },
        ],
      },
      {
        id: 1,
        name: 'Mango',
        color: fullConfig.theme.colors.db.mango,
        logo: '@/assets/protocols/mangologo.svg',
        actions: [],
      },
      {
        id: 2,
        name: 'Saber',
        color: fullConfig.theme.colors.db.saber,
        logo: '@/assets/protocols/saberlogo.jpeg',
        actions: [],
      },
    ]);
    const selectedProtocolId = ref<number>(0);
    const selectedActionId = ref<number>(0);

    const emitNewBrick = () => {
      context.emit('new-brick', {
        fill: protocols.value.filter((p) => p.id === selectedProtocolId.value)[0].color,
      });
    };

    return {
      protocols,
      selectedProtocolId,
      selectedActionId,
      emitNewBrick,
    };
  },
});
</script>

<style scoped>

</style>
