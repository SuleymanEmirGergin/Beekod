
process.env.NODE_ENV = 'test';

async function start() {
    const { app } = await import('../src/server.js');
    const PORT = 3011;
    app.listen(PORT, () => {
        console.log(`TEMP_SERVER_STARTED_ON_PORT_${PORT}`);
    });
}

start();
