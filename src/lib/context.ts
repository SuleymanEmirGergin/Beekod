import { AsyncLocalStorage } from "async_hooks";

type RequestContextStore = {
  requestId: string;
  queryCount: number;
};

const requestStore = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId() {
  return requestStore.getStore()?.requestId;
}

export function incrementQueryCount() {
  const store = requestStore.getStore();
  if (store) {
    store.queryCount++;
  }
}

export function getQueryCount() {
  return requestStore.getStore()?.queryCount || 0;
}

export function runWithRequestId(requestId: string, callback: () => void | Promise<unknown>) {
  return requestStore.run({ requestId, queryCount: 0 }, callback);
}
