/**
 * Wiro API Full Debug - See actual response
 */
import "dotenv/config";

const WIRO_API_KEY = process.env.WIRO_API_KEY || "";
const WIRO_CHAT_URL = "https://api.wiro.ai/v1/Run/google/gemini-3-flash";
const WIRO_TASK_DETAIL_URL = "https://api.wiro.ai/v1/Task/Detail";

async function main() {
    console.log("🔵 Wiro API Full Debug\n");
    
    // Step 1: Send request
    const formData = new FormData();
    formData.append("prompt", "Hello! Just say 'Test successful' and nothing else.");
    formData.append("thinkingLevel", "low");
    formData.append("temperature", "0.5");
    formData.append("maxOutputTokens", "100");
    
    console.log("📤 Sending request...");
    
    const response = await fetch(WIRO_CHAT_URL, {
        method: "POST",
        headers: { "x-api-key": WIRO_API_KEY },
        body: formData,
    });
    
    const data = await response.json();
    console.log("📥 Initial Response:", JSON.stringify(data, null, 2));
    
    if (!data.socketaccesstoken) {
        console.log("❌ No task token received");
        return;
    }
    
    // Step 2: Poll for result
    console.log("\n⏳ Polling for result...");
    
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        
        const detailResponse = await fetch(WIRO_TASK_DETAIL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": WIRO_API_KEY,
            },
            body: JSON.stringify({ tasktoken: data.socketaccesstoken }),
        });
        
        const detail = await detailResponse.json();
        const task = detail.tasklist?.[0];
        
        if (!task) continue;
        
        console.log(`   Attempt ${i + 1}: status=${task.status}`);
        
        if (task.status === "task_postprocess_end" || task.status === "task_end") {
            console.log("\n✅ Task completed!");
            console.log("\n📋 Full Task Object:");
            console.log(JSON.stringify(task, null, 2));
            
            console.log("\n🔍 Key fields:");
            console.log("   debugoutput:", JSON.stringify(task.debugoutput));
            console.log("   debugerror:", JSON.stringify(task.debugerror));
            console.log("   outputs:", JSON.stringify(task.outputs));
            console.log("   parameters:", JSON.stringify(task.parameters));
            return;
        }
        
        if (task.status === "task_error" || task.status === "task_failed") {
            console.log("\n❌ Task failed!");
            console.log("   Error:", task.debugerror);
            return;
        }
    }
    
    console.log("⏰ Timeout");
}

main().catch(console.error);
