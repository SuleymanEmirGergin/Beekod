import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(3015, () => console.log('Minimal server listening on 3015'));
