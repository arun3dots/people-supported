import { Method } from "../types";

export type EndpointDetails = Record<
  string,
  { requestType: Method; endpoint: string }
>;
