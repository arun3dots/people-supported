export * from "./auth/endpoints";
export * from "./tenants/endpoints";
export * from "./packages/endpoints";

import authEndpoints from "./auth/endpoints";
import tenantEndpoints from "./tenants/endpoints";
import packageEndpoints from "./packages/endpoints";
import { EndpointDetails } from "./types";

const endpoints: EndpointDetails = {
  ...authEndpoints,
  ...tenantEndpoints,
  ...packageEndpoints,
};

export default endpoints;
