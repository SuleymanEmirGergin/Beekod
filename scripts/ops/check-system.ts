#!/usr/bin/env node
import axios from 'axios';

const ADMIN_KEY = process.env.ADMIN_KEY || 'Threem123';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function inspect() {
  try {
    const response = await axios.get(`${API_URL}/ops/inspect`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("Ops inspection failed:", error.message);
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
    }
    process.exit(1);
  }
}

inspect();
