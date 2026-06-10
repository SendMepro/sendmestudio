import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'messages.json');

async function readMessages() {
  try {
    const content = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    // If file missing, initialize empty array
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify([]));
    return [];
  }
}

async function writeMessages(messages: any[]) {
  await fs.writeFile(dataFile, JSON.stringify(messages, null, 2));
}

export async function GET() {
  const messages = await readMessages();
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const newMessage = await request.json();
  const messages = await readMessages();
  messages.push({ id: Date.now().toString(), timestamp: new Date().toISOString(), ...newMessage });
  await writeMessages(messages);
  return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
}
