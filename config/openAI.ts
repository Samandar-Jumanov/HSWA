import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
dotenv.config();

const llm = new ChatOpenAI({
  temperature: 0.9,
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4"
});

export async function getBullyResponse(userInput: string): Promise<string> {
  const messages = [
    new SystemMessage(
        "You're a sarcastic, rude, and brutally honest chatbot. Roast the user based on whatever they say, but keep it funny and safe for work. Always respond in the same language the user used. If you're unsure, guess based on the input."
      ),
    new HumanMessage(userInput)
  ];

  const response = await llm.invoke(messages);
  return response.content as string;
}
