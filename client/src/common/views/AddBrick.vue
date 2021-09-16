<template>
  <Modal>
    <p>Pick a protocol:</p>
    <div class="flex flex-row justify-between">
      <SelectableBox
        v-for="p in listProtocols()" :key="p.id"
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
      v-for="a in getProtocol(selectedProtocolId).actions" :key="a.id"
      class="flex-1"
      :color="getProtocol(selectedProtocolId).color"
      :selected="selectedActionId === a.id"
      @click="selectedActionId = a.id"
    >
      <p>{{ a.name }}</p>
    </SelectableBox>

    <div class="flex flex-col items-center w-full">
      <Button class="mt-5" size="med" @click="emitNewBrick">ADD</Button>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Modal from '@/common/components/primitive/Modal.vue';
import Button from '@/common/components/primitive/Button.vue';
import SelectableBox from '@/common/components/primitive/SelectableBox.vue';
import ProtocolLogo from '@/common/components/ProtocolLogo.vue';
import { listProtocols, getProtocol } from '@/common/protocols';

export default defineComponent({
  components: {
    ProtocolLogo,
    SelectableBox,
    Button,
    Modal,
  },
  emits: ['new-brick'],
  setup(props, context) {
    const selectedProtocolId = ref<number>(0);
    const selectedActionId = ref<number>(0);

    const emitNewBrick = () => {
      context.emit('new-brick', {
        protocolId: selectedProtocolId.value,
        actionId: selectedActionId.value,
      });
    };

    return {
      selectedProtocolId,
      selectedActionId,
      getProtocol,
      listProtocols,
      emitNewBrick,
    };
  },
});
</script>

<style scoped>

</style>
