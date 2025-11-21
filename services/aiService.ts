import { APP_CONFIG } from '../constants';
import { WebhookPayload } from '../types';

export const sendToAI = async (payload: WebhookPayload): Promise<string> => {


  try {
    const response = await fetch(APP_CONFIG.AI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.EVOLUTION_API_KEY}` // Optional auth
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('AI Webhook failed');
    }

    const data = await response.json();
    // Assuming the webhook returns { response: "text" } or similar
    return data.response || data.message || data.text || "No text response from AI";
  } catch (e) {
    console.error(e);
    return "Error connecting to AI Agent.";
  }
};
