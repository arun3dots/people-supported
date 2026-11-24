const assert = require("node:assert/strict");
const {
  signHs256,
  signRs256,
  rawHttpGet,
  loginViaCognito,
  apiFetchInPage,
  seedLegacyDomainCookies,
} = require("./helpers.cjs");

async function runBrowserIntegrationScenarios({
  browser,
  proxy,
  oidc,
  prisma,
  ids,
  jwtSecret,
  appPrivateKeyPem,
  apiIssuer,
  apiAudience,
}) {
  const web = proxy.webOrigin;
  const admin = proxy.adminOrigin;
  const webHost = new URL(web).host;
  const adminHost = new URL(admin).host;

  const step = (name, fn) =>
    Promise.resolve()
      .then(fn)
      .then(() => console.log(`  PASS: ${name}`))
      .catch((err) => {
        console.error(`  FAIL: ${name} -> ${err.message}`);
        throw err;
      });

  // 1. Login redirects, same-origin /api proxy, and zero client storage leaks
  await step("1. Login redirects & same-origin /api routing without JS token exposure", async () => {
    await browser.clearAllCookies();
    await browser.goto(`${web}/admin/dashboard`);
    const loginUrl = await browser.waitForUrl((u) => u.startsWith(`${web}/login`));
    assert.ok(loginUrl.startsWith(`${web}/login`));
    const startHref = await browser.evaluate(
      "document.querySelector('a[href*=\"/auth/cognito/start\"]')?.getAttribute('href')",
    );
    assert.equal(startHref, "/api/auth/cognito/start");

    oidc.setIdentity(ids.adminSub, "admin-a@cantracare.test");
    await browser.clickSelector('a[href*="/auth/cognito/start"]');
    const dashUrl = await browser.waitForUrl((u) => u.startsWith(`${web}/admin/dashboard`));
    assert.ok(!dashUrl.includes("code=") && !dashUrl.includes("token="));

    const clientState = await browser.evaluate(`({
      cookie: document.cookie,
      lsKeys: Object.keys(localStorage),
      ssKeys: Object.keys(sessionStorage),
    })`);
    assert.equal(clientState.cookie.includes("access_token"), false);
    assert.equal(clientState.cookie.includes("refresh_token"), false);
    assert.equal(clientState.lsKeys.length, 0);
    assert.equal(clientState.ssKeys.length, 0);
  });

  // 2. OAuth callback handling: MFA failure & disabled accounts
  await step("2. OAuth callback rejects MFA failure & disabled accounts with clear alerts", async () => {
    await browser.clearAllCookies();
    oidc.setIdentity(ids.adminSub);
    oidc.setMode("mfa_failed");
    await browser.goto(`${web}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start"]');
    await browser.waitForUrl((u) => u.includes("cognito=failed") && u.includes("reason=mfa_failed"));
    await browser.waitForText(/Multi-factor authentication was not completed/i);
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token").length, 0);

    oidc.setIdentity(ids.disabledSub);
    await browser.goto(`${web}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start"]');
    await browser.waitForUrl((u) => u.includes("cognito=failed") && u.includes("reason=account_disabled"));
    await browser.waitForText(/disabled or unavailable/i);
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token").length, 0);
  });

  // 3. CSRF / state protection
  await step("3. CSRF/state protection blocks tampered state, missing binding & callback replay", async () => {
    await browser.clearAllCookies();
    oidc.setIdentity(ids.adminSub);
    oidc.setMode("tampered_state");
    await browser.goto(`${web}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start"]');
    await browser.waitForUrl((u) => u.includes("cognito=failed"));
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token").length, 0);

    await browser.goto(`${web}/api/auth/cognito/callback?code=fake&state=${"a".repeat(43)}`);
    await browser.waitForUrl((u) => u.includes("cognito=failed"));
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token").length, 0);

    oidc.setIdentity(ids.superAdminSub);
    const startRes = await rawHttpGet(proxy.port, "/api/auth/cognito/start", { Host: webHost });
    const setCookie = startRes.headers["set-cookie"];
    const startCookie = Array.isArray(setCookie) ? setCookie[0]?.split(";")[0] : undefined;
    const authRes = await fetch(String(startRes.headers.location), { redirect: "manual" });
    const authCb = new URL(String(authRes.headers.get("location")));
    const crossCb = await rawHttpGet(proxy.port, `${authCb.pathname}${authCb.search}`, {
      Host: adminHost,
      ...(startCookie ? { Cookie: startCookie } : {}),
    });
    assert.ok(String(crossCb.headers.location).startsWith(`${admin}/login?cognito=failed`));

    await rawHttpGet(proxy.port, `${authCb.pathname}${authCb.search}`, {
      Host: webHost,
      ...(startCookie ? { Cookie: startCookie } : {}),
    });
    const replayCb = await rawHttpGet(proxy.port, `${authCb.pathname}${authCb.search}`, {
      Host: webHost,
      ...(startCookie ? { Cookie: startCookie } : {}),
    });
    assert.equal(replayCb.headers.location, `${web}/login?cognito=failed`);
  });

  // 4. Cookie scope & duplicate-cookie migration
  await step("4. Cookie scope & duplicate-cookie migration (host-only, clearing stale domain cookies)", async () => {
    await browser.clearAllCookies();
    const expiredLegacyJwt = signHs256(jwtSecret, {
      sub: ids.carerUserId,
      email: "carer-a@cantracare.test",
      roleName: "Carer",
      tenantId: ids.tenantAId,
      mfaVerified: true,
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    await seedLegacyDomainCookies(browser, web, expiredLegacyJwt);

    oidc.setIdentity(ids.adminSub);
    await loginViaCognito(browser, web);

    const cookies = await browser.getAllCookies();
    const accessCookies = cookies.filter((c) => c.name === "access_token");
    const refreshCookies = cookies.filter((c) => c.name === "refresh_token");
    assert.equal(accessCookies.length, 1);
    assert.equal(accessCookies[0].domain, "web.cantracare.test");
    assert.equal(accessCookies[0].httpOnly, true);
    assert.equal(accessCookies[0].sameSite, "Strict");
    assert.equal(accessCookies[0].path, "/");
    assert.equal(refreshCookies.length, 1);
    assert.equal(refreshCookies[0].domain, "web.cantracare.test");
    assert.equal(refreshCookies[0].httpOnly, true);
    assert.equal(refreshCookies[0].sameSite, "Strict");
    assert.equal(refreshCookies[0].path, "/api/auth");
    assert.equal(cookies.some((c) => c.domain === ".cantracare.test"), false);
    assert.equal(cookies.some((c) => c.name === "sl_cognito_binding"), false);

    // Live duplicate-cookie resilience: active stale .cantracare.test Carer cookie alongside Admin Cognito cookie
    const activeLegacyCarerJwt = signHs256(jwtSecret, {
      sub: ids.carerUserId,
      email: "carer-a@cantracare.test",
      roleName: "Carer",
      tenantId: ids.tenantAId,
      mfaVerified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await seedLegacyDomainCookies(browser, web, activeLegacyCarerJwt);
    await browser.goto(`${web}/admin/dashboard`);
    const stayedUrl = await browser.waitForUrl((u) => u.startsWith(`${web}/admin/dashboard`));
    assert.ok(stayedUrl.startsWith(`${web}/admin/dashboard`));
    const refRes = await apiFetchInPage(browser, "/api/auth/refresh", "POST");
    assert.equal(refRes.status, 201);
    const afterRefreshCookies = await browser.getAllCookies();
    assert.equal(afterRefreshCookies.some((c) => c.domain === ".cantracare.test"), false);
  });

  // 5. Expired sessions & refresh behavior
  await step("5. Expired access token auto-refreshes; revoked session expires cleanly", async () => {
    const activeSession = await prisma.cognitoSession.findFirstOrThrow({
      where: { userId: ids.adminUserId, revokedAt: null },
      orderBy: { authenticatedAt: "desc" },
    });
    const prevRefresh = (await browser.getAllCookies()).find((c) => c.name === "refresh_token")?.value;
    const expiredAccess = signRs256(appPrivateKeyPem, {
      iss: apiIssuer,
      aud: apiAudience,
      sub: ids.adminUserId,
      sid: activeSession.id,
      mfaVerified: true,
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    await browser.setCookie({
      name: "access_token",
      value: expiredAccess,
      url: web,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    await browser.goto(`${web}/admin/dashboard`);
    await browser.waitForUrl((u) => u.startsWith(`${web}/admin/dashboard`));
    const nextRefresh = (await browser.getAllCookies()).find((c) => c.name === "refresh_token")?.value;
    assert.ok(nextRefresh && nextRefresh !== prevRefresh);

    await prisma.cognitoSession.update({
      where: { id: activeSession.id },
      data: { revokedAt: new Date() },
    });
    await browser.setCookie({
      name: "access_token",
      value: expiredAccess,
      url: web,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    await browser.goto(`${web}/admin/dashboard`);
    await browser.waitForUrl((u) => u.startsWith(`${web}/login`));
    await browser.waitForText(/session has expired/i);
  });

  // 6. Logout & revoked-session replay defense
  await step("6. Logout revokes Cognito/DB session & blocks replayed pre-logout cookies", async () => {
    await browser.clearAllCookies();
    oidc.setIdentity(ids.adminSub);
    await loginViaCognito(browser, web);

    const savedAccess = (await browser.getAllCookies()).find((c) => c.name === "access_token");
    assert.ok(savedAccess);
    const statsBefore = oidc.stats();

    await browser.realClickText("header button", "Admin Pilot");
    await browser.realClickText('[role="menuitem"]', "Log out");
    await browser.waitForUrl((u) => u.startsWith(`${web}/login`));

    const statsAfter = oidc.stats();
    assert.equal(statsAfter.logoutHits - statsBefore.logoutHits, 1);
    assert.equal(statsAfter.revokedCount - statsBefore.revokedCount, 1);
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token" || c.name === "refresh_token").length, 0);

    await browser.setCookie({
      name: "access_token",
      value: savedAccess.value,
      url: web,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    await browser.goto(`${web}/admin/dashboard`);
    const replayRedirect = await browser.waitForUrl((u) => u.startsWith(`${web}/login`));
    assert.ok(replayRedirect.startsWith(`${web}/login`));
    const meReplay = await apiFetchInPage(browser, "/api/auth/me", "POST");
    assert.equal(meReplay.status, 401);
  });

  // 7. Unauthorized tenant & RBAC access
  await step("7. RBAC and tenant isolation enforced for Cognito Carer", async () => {
    await browser.clearAllCookies();
    oidc.setIdentity(ids.carerSub);
    await browser.goto(`${web}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start"]');
    await browser.waitForUrl((u) => u.startsWith(`${web}/carer/dashboard`));

    await browser.goto(`${web}/admin/dashboard`);
    await browser.waitForUrl((u) => u.startsWith(`${web}/carer/dashboard`));

    const crossTenant = await apiFetchInPage(browser, `/api/residents/${ids.residentBId}`, "GET");
    assert.ok([403, 404].includes(crossTenant.status));
    const saAttempt = await apiFetchInPage(browser, "/api/super-admin/tenants", "GET");
    assert.equal(saAttempt.status, 403);
  });

  // 8. SuperAdmin portal support & privilege boundary
  await step("8. SuperAdmin blocks Tenant Admin Cognito login and admits verified SuperAdmin", async () => {
    await browser.clearAllCookies();
    oidc.setIdentity(ids.adminSub);
    await browser.goto(`${admin}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start?app=superadmin"]');
    await browser.waitForUrl((u) => u.includes("cognito=failed") && u.includes("reason=unauthorized"));
    await browser.waitForText(/does not have SuperAdmin privileges/i);
    assert.equal((await browser.getAllCookies()).filter((c) => c.name === "access_token").length, 0);

    await browser.clearAllCookies();
    oidc.setIdentity(ids.adminSub);
    await loginViaCognito(browser, web);
    const tenantAdminAccess = (await browser.getAllCookies()).find((c) => c.name === "access_token");
    await browser.setCookie({
      name: "access_token",
      value: tenantAdminAccess.value,
      url: admin,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    await browser.goto(`${admin}/dashboard`);
    await browser.waitForUrl((u) => u.startsWith(`${admin}/login`) && u.includes("reason=unauthorized"));
    const deniedTenants = await apiFetchInPage(browser, "/api/super-admin/tenants", "GET");
    assert.equal(deniedTenants.status, 403);

    await browser.clearAllCookies();
    oidc.setIdentity(ids.superAdminSub);
    await browser.goto(`${admin}/login`);
    await browser.clickSelector('a[href*="/auth/cognito/start?app=superadmin"]');
    await browser.waitForUrl((u) => u.startsWith(`${admin}/dashboard`));
    await browser.waitForText(/Platform Overview/i);
    const tenantsRes = await apiFetchInPage(browser, "/api/super-admin/tenants", "GET");
    assert.equal(tenantsRes.status, 200);
    const adminCookies = await browser.getAllCookies();
    const adminAccess = adminCookies.find(
      (c) => c.name === "access_token" && c.domain === "admin.cantracare.test",
    );
    assert.ok(adminAccess && adminAccess.httpOnly && adminAccess.sameSite === "Strict");

    const beforeLogout = oidc.stats().logoutHits;
    await browser.realClickSelector("header button");
    await browser.realClickText('[role="menuitem"]', "Log out");
    await browser.waitForUrl((u) => u.startsWith(`${admin}/login`));
    assert.equal(oidc.stats().logoutHits - beforeLogout, 1);
  });

  // 9. Legacy password authentication compatibility on both portals
  await step("9. Legacy email/password login fallback works on both Web and SuperAdmin", async () => {
    await browser.clearAllCookies();
    await browser.goto(`${web}/login`);
    await browser.fillInput("#email", "legacy-a@cantracare.test");
    await browser.fillInput("#password", ids.password);
    await browser.clickSelector('button[type="submit"]');
    await browser.waitForUrl((u) => u.startsWith(`${web}/admin/dashboard`));
    const webCookies = await browser.getAllCookies();
    const webAccess = webCookies.find((c) => c.name === "access_token");
    assert.equal(webAccess?.domain, "web.cantracare.test");
    assert.equal(webAccess?.httpOnly, true);

    await browser.clearAllCookies();
    await browser.goto(`${admin}/login`);
    await browser.fillInput("#email", "superadmin@cantracare.test");
    await browser.fillInput("#password", ids.password);
    await browser.clickSelector('button[type="submit"]');
    await browser.waitForUrl((u) => u.startsWith(`${admin}/dashboard`));
    await browser.waitForText(/Platform Overview/i);
  });
}

module.exports = { runBrowserIntegrationScenarios };
