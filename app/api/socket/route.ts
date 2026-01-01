import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This route is primarily for informational purposes, indicating the presence
  // of an external Socket.IO server. The actual Socket.IO connection happens
  // directly from the client to the SOCKET_PORT.
  return NextResponse.json({
    message: 'External Socket.IO server is expected to be running',
    socketServerUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
    status: 'info'
  })
}

export async function POST(request: NextRequest) {
  // This route can be used for any future API interactions related to the socket
  // server that don't involve direct Socket.IO communication.
  try {
    const body = await request.json()
    return NextResponse.json({
      message: 'Socket.IO API route received POST request',
      data: body
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}