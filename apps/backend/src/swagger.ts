import swaggerJsdoc from "swagger-jsdoc";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MarketPulse API",
      version: "1.0.0",
      description: "Real-time financial market tracking API with AI-powered reports, alerts, and watchlists.",
    },
    servers: [
      { url: "/api/v1", description: "API v1" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        Message: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string", nullable: true },
            role: { type: "string", enum: ["USER", "ADMIN"] },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string", nullable: true },
            role: { type: "string", enum: ["USER", "ADMIN"] },
            currency: { type: "string" },
            locale: { type: "string" },
            theme: { type: "string", enum: ["light", "dark", "system"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        TokenPair: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        Asset: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            symbol: { type: "string" },
            coingeckoId: { type: "string", nullable: true },
            name: { type: "string" },
            type: { type: "string", enum: ["CRYPTO", "STOCK"] },
            image: { type: "string", nullable: true },
            currentPrice: { type: "number", nullable: true },
            marketCap: { type: "number", nullable: true },
            volume24h: { type: "number", nullable: true },
            change24h: { type: "number", nullable: true },
            rank: { type: "integer", nullable: true },
            sector: { type: "string", nullable: true },
            exchange: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AssetSnapshot: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
            price: { type: "number" },
            marketCap: { type: "number", nullable: true },
            volume: { type: "number", nullable: true },
            change24h: { type: "number", nullable: true },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        PaginatedAssets: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Asset" } },
            nextCursor: { type: "string", nullable: true },
            hasNext: { type: "boolean" },
          },
        },
        Watchlist: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            assets: {
              type: "array",
              items: { $ref: "#/components/schemas/WatchlistAsset" },
            },
          },
        },
        WatchlistAsset: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            watchlistId: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            sortOrder: { type: "integer" },
            addedAt: { type: "string", format: "date-time" },
            asset: { $ref: "#/components/schemas/Asset" },
          },
        },
        Alert: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["ABOVE", "BELOW"] },
            targetPrice: { type: "number" },
            isTriggered: { type: "boolean" },
            isActive: { type: "boolean" },
            triggeredAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            asset: { $ref: "#/components/schemas/Asset" },
          },
        },
        AIReport: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
            summary: { type: "string" },
            content: { type: "string" },
            sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"], nullable: true },
            isPinned: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid", nullable: true },
            user: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                email: { type: "string" },
                name: { type: "string", nullable: true },
              },
            },
            action: { type: "string" },
            entity: { type: "string", nullable: true },
            entityId: { type: "string", format: "uuid", nullable: true },
            metadata: { type: "object", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PaginatedAuditLogs: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
            nextCursor: { type: "string", nullable: true },
            hasNext: { type: "boolean" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & password management" },
      { name: "Users", description: "User profile management" },
      { name: "Assets", description: "Financial assets data" },
      { name: "Watchlists", description: "User watchlists" },
      { name: "Alerts", description: "Price alerts" },
      { name: "AI", description: "AI-powered reports" },
      { name: "Audit Log", description: "Admin audit log (admin only)" },
    ],
    paths: {
      "/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Create a new account",
          description: "Rate limited: 10 requests per minute.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, description: "Must contain uppercase, lowercase, and number" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Account created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            "409": { description: "Email already in use", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with credentials",
          description: "Rate limited: 10 requests per minute.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: {
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "New token pair", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenPair" } } } },
            "401": { description: "Invalid refresh token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset email",
          description: "Always returns success to prevent email enumeration.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Reset email sent (if account exists)", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
          },
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with token",
          description: "Token expires after 1 hour. All refresh tokens are revoked on success.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password reset", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
            "400": { description: "Invalid or expired token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout and revoke refresh token",
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Logged out", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get current user profile",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update current user profile",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    currency: { type: "string" },
                    locale: { type: "string" },
                    theme: { type: "string", enum: ["light", "dark", "system"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/assets/top100": {
        get: {
          tags: ["Assets"],
          summary: "List top assets (paginated)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "cursor", in: "query", schema: { type: "string", format: "uuid" }, description: "Cursor for pagination" },
            { name: "sort", in: "query", schema: { type: "string", enum: ["rank", "marketCap", "volume24h", "change24h", "currentPrice"], default: "rank" } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
            { name: "type", in: "query", schema: { type: "string", enum: ["CRYPTO", "STOCK", "ETF", "COMMODITY"] } },
          ],
          responses: {
            "200": { description: "Paginated asset list", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedAssets" } } } },
            "400": { description: "Invalid type filter", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/assets/{id}": {
        get: {
          tags: ["Assets"],
          summary: "Get asset by ID",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Asset details", content: { "application/json": { schema: { $ref: "#/components/schemas/Asset" } } } },
            "404": { description: "Asset not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/assets/{id}/history": {
        get: {
          tags: ["Assets"],
          summary: "Get price history for an asset",
          description: "Returns up to 100 data points.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            { name: "days", in: "query", schema: { type: "integer", default: 7, maximum: 365 }, description: "Number of days of history" },
          ],
          responses: {
            "200": { description: "Price history", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AssetSnapshot" } } } } },
          },
        },
      },

      "/watchlists": {
        get: {
          tags: ["Watchlists"],
          summary: "List user watchlists",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "User watchlists with assets", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Watchlist" } } } } },
          },
        },
        post: {
          tags: ["Watchlists"],
          summary: "Create a watchlist",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Watchlist created", content: { "application/json": { schema: { $ref: "#/components/schemas/Watchlist" } } } },
          },
        },
      },
      "/watchlists/{id}": {
        patch: {
          tags: ["Watchlists"],
          summary: "Rename a watchlist",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated watchlist", content: { "application/json": { schema: { $ref: "#/components/schemas/Watchlist" } } } },
            "404": { description: "Watchlist not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Watchlists"],
          summary: "Delete a watchlist",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Watchlist deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
            "404": { description: "Watchlist not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/watchlists/{id}/assets": {
        post: {
          tags: ["Watchlists"],
          summary: "Add an asset to a watchlist",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["assetId"],
                  properties: {
                    assetId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Asset added", content: { "application/json": { schema: { $ref: "#/components/schemas/WatchlistAsset" } } } },
            "404": { description: "Watchlist not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/watchlists/{id}/assets/{assetId}": {
        delete: {
          tags: ["Watchlists"],
          summary: "Remove an asset from a watchlist",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            { name: "assetId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Asset removed", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
            "404": { description: "Watchlist not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/alerts": {
        get: {
          tags: ["Alerts"],
          summary: "List user alerts",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "User alerts", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Alert" } } } } },
          },
        },
        post: {
          tags: ["Alerts"],
          summary: "Create a price alert",
          description: "Maximum 10 alerts per user.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["assetId", "type", "targetPrice"],
                  properties: {
                    assetId: { type: "string", format: "uuid" },
                    type: { type: "string", enum: ["ABOVE", "BELOW"] },
                    targetPrice: { type: "number", exclusiveMinimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Alert created", content: { "application/json": { schema: { $ref: "#/components/schemas/Alert" } } } },
            "400": { description: "Maximum alerts reached", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/alerts/triggered": {
        get: {
          tags: ["Alerts"],
          summary: "Get newly triggered alerts",
          description: "Checks active alerts against current prices and marks any newly triggered ones. Returns only alerts that were triggered in this check.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Newly triggered alerts", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Alert" } } } } },
          },
        },
      },
      "/alerts/{id}": {
        patch: {
          tags: ["Alerts"],
          summary: "Toggle alert active status",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["isActive"],
                  properties: {
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated alert", content: { "application/json": { schema: { $ref: "#/components/schemas/Alert" } } } },
            "404": { description: "Alert not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Alerts"],
          summary: "Delete an alert",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Alert deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
            "404": { description: "Alert not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/ai/report/{assetId}/latest": {
        get: {
          tags: ["AI"],
          summary: "Get or generate latest AI report",
          description: "Returns today's report if available, otherwise generates a new one using OpenAI with web search. Generation may take 10-30 seconds. Rate limited: 50 requests per minute.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "assetId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "AI report", content: { "application/json": { schema: { $ref: "#/components/schemas/AIReport" } } } },
            "404": { description: "Asset not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/ai/report/{assetId}/history": {
        get: {
          tags: ["AI"],
          summary: "Get AI report history",
          description: "Returns up to 20 most recent reports for the asset.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "assetId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Report history", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AIReport" } } } } },
          },
        },
      },

      "/audit-log": {
        get: {
          tags: ["Audit Log"],
          summary: "List audit logs (admin only)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
            { name: "cursor", in: "query", schema: { type: "string", format: "uuid" }, description: "Cursor for pagination" },
          ],
          responses: {
            "200": { description: "Paginated audit logs", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedAuditLogs" } } } },
            "403": { description: "Forbidden (admin only)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MarketPulse API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>html{box-sizing:border-box;overflow-y:scroll}*,*:before,*:after{box-sizing:inherit}body{margin:0;background:#fafafa}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/docs.json", dom_id: "#swagger-ui", presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset], layout: "BaseLayout" });
  </script>
</body>
</html>`;

export function setupSwagger(app: Express) {
  app.get("/docs", (_req, res) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com;");
    res.type("html").send(swaggerHtml);
  });

  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
}
