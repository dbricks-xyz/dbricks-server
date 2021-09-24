export async function pause(ms: number) {
  //weird semantics - but needed to work inside jest
  //taken from https://stackoverflow.com/questions/46077176/jest-settimeout-not-pausing-test
  await new Promise(res => setTimeout(() => {
      res(0)
    }, ms)
  );
}
