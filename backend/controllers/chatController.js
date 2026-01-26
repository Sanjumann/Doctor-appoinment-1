import { GoogleGenAI } from "@google/genai";

// System prompt for hospital context
const SYSTEM_PROMPT = `You are a helpful AI assistant for Appointy, a hospital appointment management platform. Your role is to help patients with:

1. **Booking Appointments**: Guide users on how to book appointments with doctors
2. **Doctor Information**: Provide information about finding doctors by specialty
3. **Platform Navigation**: Help users navigate the website
4. **General Queries**: Answer questions about hospital services

Key Information about Appointy:
- Users can browse doctors by specialty on the "All Doctors" page
- To book an appointment, users need to create an account first
- Available specialties include: General Physician, Gynecologist, Dermatologist, Pediatrician, Neurologist, Gastroenterologist
- Payment options include Cash and Razorpay
- Users can view and manage appointments in "My Appointments" section
- The platform supports patient, doctor, and admin roles

Guidelines:
- Be friendly, concise, and helpful
- If asked about specific doctor availability or appointment slots, direct users to check the doctors page
- For medical emergencies, advise users to call emergency services
- Keep responses brief (2-3 sentences when possible)
- Use emojis sparingly to be friendly

Remember: You are NOT a medical professional. Do not provide medical advice. For health concerns, always recommend consulting a doctor.`;

// Store conversation history (in production, use a database)
const conversationHistory = new Map();

export const sendMessage = async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return res.status(500).json({
                success: false,
                message: 'Gemini API key not configured. Please add your API key to backend/.env'
            });
        }

        // Initialize Gemini AI with API key
        const ai = new GoogleGenAI({ apiKey });

        // Get or create conversation history for this session
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, []);
        }
        const history = conversationHistory.get(sessionId);

        // Build the full prompt with context
        const contextMessages = history.map(h =>
            `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`
        ).join('\n');

        const fullPrompt = `${SYSTEM_PROMPT}

${contextMessages ? `Previous conversation:\n${contextMessages}\n\n` : ''}User: ${message}

Please respond helpfully and concisely:`;

        // Generate response using the new SDK
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        const botMessage = response.text;

        // Update conversation history (keep last 10 exchanges)
        history.push(
            { role: 'user', content: message },
            { role: 'assistant', content: botMessage }
        );
        if (history.length > 20) {
            history.splice(0, 2); // Remove oldest exchange
        }

        res.json({
            success: true,
            message: botMessage
        });

    } catch (error) {
        console.error('Chat error:', error);

        // Provide more specific error messages
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
            errorMessage = 'Invalid API key. Please check your Gemini API key in backend/.env';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (error.message?.includes('SAFETY')) {
            errorMessage = 'I cannot respond to that query. Please try asking something else.';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Clear conversation history
export const clearHistory = async (req, res) => {
    try {
        const { sessionId = 'default' } = req.body;
        conversationHistory.delete(sessionId);
        res.json({
            success: true,
            message: 'Conversation history cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear history'
        });
    }
};
