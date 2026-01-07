
import { app } from '../src/server.js';
import { logger } from '../src/config.js';

const PORT = 3011;

const server = app.listen(PORT, () => {
    console.log(`TEMP_SERVER_STARTED_ON_PORT_${PORT}`);
});
