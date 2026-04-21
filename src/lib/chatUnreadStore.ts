// In-memory chat unread store — shared between chat page and NotificationBell.
// Zero egress: fed from realtime payloads already pushed to the browser.

export interface ChatUnread { roomId: number; roomName: string; preview: string }
type UnreadListener = (items: ChatUnread[]) => void

export const chatUnreadStore = (() => {
  let items: ChatUnread[] = []
  const listeners = new Set<UnreadListener>()
  return {
    add(item: ChatUnread) {
      items = [item, ...items.filter(i => i.roomId !== item.roomId)].slice(0, 20)
      listeners.forEach(l => l([...items]))
    },
    clearRoom(roomId: number) {
      items = items.filter(i => i.roomId !== roomId)
      listeners.forEach(l => l([...items]))
    },
    clearAll() { items = []; listeners.forEach(l => l([])) },
    subscribe(l: UnreadListener) { listeners.add(l); l([...items]); return () => { listeners.delete(l) } },
    get count() { return items.length },
  }
})()
