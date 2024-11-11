import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sheets.googleapis.com/v4/spreadsheets',
});

export default api;
