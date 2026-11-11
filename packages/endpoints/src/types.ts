export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointDetail {
  endpoint: string;
  requestType: HttpMethod;
}

export type EndpointDetails = Record<string, EndpointDetail>;
