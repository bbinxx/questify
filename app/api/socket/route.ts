import { NextRequest, NextResponse } from 'next/server'
import { createServer } from 'http'
import { initializeSocket } from '@/lib/socket/server'

// Create HTTP server for Socket.IO
const server = createServer()

// Initialize Socket.IO
const socketManager = initializeSocket(server)

// Handle Socket.IO upgrade requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const upgrade = searchParams.get('upgrade')
  
  if (upgrade === 'websocket') {
    // This will be handled by Socket.IO
    return new NextResponse(null, { status: 101 })
  }
  
  return NextResponse.json({ 
    message: 'Socket.IO server is running',
    status: 'connected'
  })
}

// Handle POST requests for Socket.IO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle any POST requests if needed
    return NextResponse.json({ 
      message: 'Socket.IO POST endpoint',
      data: body
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

// Export the server for use in other parts of the application
export { server as socketServer }
