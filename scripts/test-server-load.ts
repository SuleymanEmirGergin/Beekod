import "../env.js";

async function testLoad() {
    try {
        console.log("Attempting to load server...");
        await import("../src/server.js");
        console.log("Server loaded successfully!");
    } catch (error) {
        console.error("SERVER LOAD FAILED:");
        console.error(error);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    }
    process.exit(0);
}

testLoad();
