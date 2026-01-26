// services/websocket.ts
class WeatherWebSocket {
  private socket: WebSocket | null = null
  private reconnectInterval = 5000
  private maxReconnectAttempts = 5
  private reconnectAttempts = 0
  private isConnected = false
  private messageHandlers: Array<(data: any) => void> = []

  constructor(private userId: number) {}

  connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/notifications/`

    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      console.log('WebSocket connecté')
      this.isConnected = true
      this.reconnectAttempts = 0
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.messageHandlers.forEach(handler => handler(data))
      } catch (error) {
        console.error('Erreur parsing WebSocket message:', error)
      }
    }

    this.socket.onclose = () => {
      console.log('WebSocket déconnecté')
      this.isConnected = false
      this.attemptReconnect()
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect()
        }
      }, this.reconnectInterval * this.reconnectAttempts)
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
    }
  }

  onMessage(handler: (data: any) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (data: any) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }
}

export const createWeatherWebSocket = (userId: number) => {
  return new WeatherWebSocket(userId)
}