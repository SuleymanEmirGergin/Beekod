import { AsyncLocalStorage } from "async_hooks";

type RequestContextStore = {
  requestId: string;
};

const requestStore = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId() {
  return requestStore.getStore()?.requestId;
}

export function runWithRequestId(requestId: string, callback: () => void) {
  return requestStore.run({ requestId }, callback);
}
