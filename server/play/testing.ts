import axios from 'axios';

async function mangoTest() {
  const accounts = await axios.get('http://localhost:3000/mango/accounts');
  console.log(accounts.data);
}

mangoTest();
