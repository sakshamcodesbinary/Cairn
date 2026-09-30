// Midnight's indexer supports Node's ws namespace and a browser default export.
// Supply both shapes explicitly so Rollup never substitutes an undefined named export.
const BrowserWebSocket = globalThis.WebSocket;
export { BrowserWebSocket as WebSocket };
export default BrowserWebSocket;
