import { split } from "../render/core/cg.js";
import { AIQuery } from "../util/aiquery.js";

/*
How to try this demo (end-to-end)
1) Make sure the server is running from project root:
      ./startserver
2) Make sure OpenAI key is available to server/main.js:
      .env contains OPENAI_API_KEY=your_key
   If .env does not exist yet, from project root run:
      cat > .env << 'EOF'
      OPENAI_API_KEY=your_key
      EOF
   If .env already exists, append key with:
      echo 'OPENAI_API_KEY=your_key' >> .env
3) Open the app in browser and switch to the "aiQuery" scene.
4) Open browser DevTools console and run one of:
      await askSceneAI("What is WebXR?");
   or:
      sceneAIQuestion = "Give me 3 ideas for a VR class demo.";
      await sendSceneAIQuestion();
5) The answer is rendered back into the WebXR scene text panel.

What this scene exposes globally
- askSceneAI(question: string): Promise<string>
  Sends one question to /api/aiquery and returns the answer string.
- sceneAIQuestion: string
  Shared variable you can set from console.
- sendSceneAIQuestion(): Promise<string>
  Convenience wrapper that calls askSceneAI(sceneAIQuestion).
*/

export const init = async model => {
   // Small helper class in js/util/aiquery.js that talks to /api/aiquery.
   const aiQuery = new AIQuery();

   // Guard against very long text exploding the panel layout.
   const maxChars = 2200;

   // Optional background panel behind text.
   // Keep opacity at 0 if you want transparent background.
   model.add("square").move(0, 1.58, -0.01).scale(0.72, 0.44, 1).color(0, 0, 0).opacity(0);

   // Text container node. We rebuild only this node's children on each update.
   const textRoot = model.add().move(-0.52, 1.92, 0).scale(0.55);

   // Rebuild panel text in-world.
   // We clear old text geometry and add a fresh clay.text(...) node each call.
   const renderPanel = (question, answer, status = "ready") => {
      while (textRoot.nChildren()) {
         textRoot.remove(0);
      }

      // Fallback content to keep panel readable before first query.
      const safeQuestion = question && question.trim() ? question.trim() : "(none)";
      const safeAnswer = answer && answer.trim() ? answer.trim() : "(none yet)";
      let panelText =
         "AI Query Demo\n" +
         "Type in browser console:\n" +
         'askSceneAI("your question")\n\n' +
         `Status: ${status}\n\n` +
         `Question:\n${safeQuestion}\n\n` +
         `Answer:\n${safeAnswer}`;

      // Hard cap for safety. Prevents huge responses from flooding geometry.
      if (panelText.length > maxChars) {
         panelText = panelText.substring(0, maxChars) + "\n...[truncated]";
      }

      // Same style as text scenes: split long text lines and render with clay.text.
      textRoot.add(clay.text(split(panelText, 62))).color(1, 1, 1);
   };

   // Keep latest values for panel refresh and debugging.
   let lastQuestion = "";
   let lastAnswer = "";

   // Main console API:
   // Example: await askSceneAI("Explain spatial computing in one sentence.");
   window.askSceneAI = async question => {
      const prompt = (question || "").toString().trim();
      if (!prompt) {
         console.error('Usage: askSceneAI("your question")');
         return "";
      }

      // Immediately show progress in scene.
      lastQuestion = prompt;
      renderPanel(lastQuestion, "Thinking...", "sending");
      console.log(`[aiQuery scene] Sending: ${lastQuestion}`);

      try {
         // Send question to server route /api/aiquery (through AIQuery helper).
         const response = await aiQuery.askAI(lastQuestion);
         lastAnswer = response || "";

         // Render successful answer into the scene.
         renderPanel(lastQuestion, lastAnswer, "done");
         console.log("[aiQuery scene] Received:", lastAnswer);
         return lastAnswer;
      } catch (error) {
         // Render error text in scene so failure is visible in XR, not only console.
         lastAnswer = `Error: ${error.message}`;
         renderPanel(lastQuestion, lastAnswer, "error");
         console.error("[aiQuery scene] Error:", error.message);
         return lastAnswer;
      }
   };

   // Alternate console flow:
   // sceneAIQuestion = "..."; await sendSceneAIQuestion();
   window.sceneAIQuestion = "";
   window.sendSceneAIQuestion = () => window.askSceneAI(window.sceneAIQuestion);

   // Initial panel text so user sees instructions in-world immediately.
   renderPanel("", "", "ready");
   console.log('[aiQuery scene] Ready. Use askSceneAI("your question") in browser console.');

   // Scene has no per-frame dynamic behavior right now.
   model.animate(() => {});
}
