import { useState, useEffect, useRef } from 'react'

export function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState('CONNECTING')
  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setReadyState('OPEN')
    }

    ws.current.onmessage = (event) => {
      setLastMessage({ data: event.data })
    }

    ws.current.onclose = () => {
      setReadyState('CLOSED')
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.current.close()
    }
  }, [url])

  const sendMessage = (message) => {
    if (ws.current && readyState === 'OPEN') {
      ws.current.send(message)
    }
  }

  return { lastMessage, readyState, sendMessage }
}
